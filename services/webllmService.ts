import { CreateMLCEngine } from "@mlc-ai/web-llm";
import type { Message } from "../types";

export type WebLLMInitProgress = {
  progress?: number;
  timeElapsed?: number;
  text?: string;
  [key: string]: any;
};

/**
 * Minimal WebLLM wrapper for:
 * - loading a selected model
 * - streaming chat completions
 * - basic offline caching via Service Worker + CacheStorage
 */
class WebLLMService {
  private engine: any | null = null;
  private loadedModelId: string | null = null;
  private loadingPromise: Promise<void> | null = null;

  /** A curated list of good mobile-friendly prebuilt models. */
  public readonly recommendedCatalog = [
    {
      id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
      name: "Qwen2 1.5B (fast, low RAM)",
      note: "Best default on phones; quick and surprisingly capable."
    },
    {
      id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
      name: "Phi-3 Mini (balanced)",
      note: "Great general chat + reasoning for its size."
    },
    {
      id: "Qwen2-7B-Instruct-q4f16_1-MLC",
      name: "Qwen2 7B (quality, heavier)",
      note: "Higher quality; may be slower / heavier on mobile."
    }
  ] as const;

  /** Very rough device-based recommendations. */
  getRecommendedModels(): { id: string; name: string; note: string }[] {
    const dm = (navigator as any).deviceMemory as number | undefined;
    // Conservative: on Android browsers, usable memory is often less than RAM.
    if (!dm || dm <= 4) return [this.recommendedCatalog[0]] as any;
    if (dm <= 8) return [this.recommendedCatalog[0], this.recommendedCatalog[1]] as any;
    return [...this.recommendedCatalog] as any;
  }

  async ensureLoaded(modelId: string, onProgress?: (p: WebLLMInitProgress) => void): Promise<void> {
    if (!modelId) throw new Error("Select a WebLLM model first.");
    if (this.engine && this.loadedModelId === modelId) return;

    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      // CreateMLCEngine internally caches model artifacts in the browser cache.
      // A Service Worker (sw.js) further improves offline behavior.
      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (p: any) => onProgress?.(p)
      });
      this.loadedModelId = modelId;
    })().finally(() => {
      this.loadingPromise = null;
    });

    return this.loadingPromise;
  }

  async streamChat(
    modelId: string,
    messages: Message[],
    onDelta: (delta: string) => void,
    onProgress?: (p: WebLLMInitProgress) => void
  ): Promise<void> {
    await this.ensureLoaded(modelId, onProgress);
    if (!this.engine) throw new Error("WebLLM engine failed to initialize.");

    const chunks = await this.engine.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of chunks as any) {
      const delta = chunk?.choices?.[0]?.delta?.content || "";
      if (delta) onDelta(delta);
    }
  }
}

export const webllmService = new WebLLMService();
