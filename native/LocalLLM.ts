
// NativeModules is a React Native specific global. 
// In a web-based preview environment, we check for it on the window object or provide a mock.
const NativeModules = (window as any).NativeModules;

const LocalLLM = NativeModules?.LocalLLM || {
  initEngine: (path: string, threads: number) => 
    console.log(`[LocalLLM Mock] Initializing engine at ${path} with ${threads} threads`),
  generate: (prompt: string, callback: (token: string) => void) => {
    console.log(`[LocalLLM Mock] Simulating native generation for: ${prompt}`);
  }
};

type TokenCallback = (token: string) => void;

export function initLLM(modelPath: string) {
  LocalLLM.initEngine(modelPath, 4);
}

export function generateStream(
  prompt: string,
  onToken: TokenCallback
) {
  LocalLLM.generate(prompt, onToken);
}
