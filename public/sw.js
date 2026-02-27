/*
  Very small Service Worker to improve offline behavior.

  - Caches the app shell so the UI loads offline after first visit.
  - Uses cache-first for large model artifacts (WebLLM downloads).
*/

const APP_CACHE = "nexus-app-v1";
const MODEL_CACHE = "nexus-model-v1";

// App-shell assets (best-effort; Vite will fingerprint on build).
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== MODEL_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isModelAsset(url) {
  // WebLLM prebuilt models are typically fetched from Hugging Face or MLC hosts.
  const u = url.toString();
  if (u.includes("huggingface.co") && u.includes("/mlc-ai/")) return true;
  if (u.includes("mlc.ai") && (u.includes("model") || u.includes("webllm"))) return true;
  // Common large artifact extensions.
  return /\.(wasm|bin|params|json|ndarray|tar)$/i.test(u);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Model assets: cache-first (offline-friendly)
  if (isModelAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(MODEL_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      })()
    );
    return;
  }

  // App assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_CACHE);
        const cached = await cache.match(req);
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => null);
        return cached || (await networkFetch) || new Response("Offline", { status: 503 });
      })()
    );
  }
});
