
import { LocalModel, AppConfig, TaskType } from './types';

export const APP_NAME = "NEXUS AI";
export const TAGLINE = "Advanced AI Assistant";

export const COLORS = {
  primary: "#0ea5e9", // Cyan
  secondary: "#8b5cf6", // Purple
  accent: "#3b82f6", // Blue
  silver: "#e2e8f0",
  background: "#07070a"
};

export const AVAILABLE_MODELS: LocalModel[] = [
  {
    id: 'qwen-2.5-coder-7b',
    name: 'Nexus Core Coder',
    version: 'Q4_K_M',
    size: '4.7 GB',
    vramRequired: '5.2 GB',
    isDownloaded: true,
    role: 'Generalist',
    description: 'Premier coding workhorse. Optimized for mobile ARM64.'
  },
  {
    id: 'phi-3-mini-reasoner',
    name: 'Nexus Logic Mini',
    version: '3.8B Q4',
    size: '2.2 GB',
    vramRequired: '2.8 GB',
    isDownloaded: true,
    role: 'Reasoning',
    description: 'Planning model. Low RAM footprint for intent detection.'
  }
];

export const TASK_SPECIFIC_PROMPTS: Record<TaskType, string> = {
  Code: "You are an expert software engineer. Respond with clean, correct, production-quality code. Use markdown and code blocks.",
  Reasoning: "You are a careful analytical assistant. Think step by step, explain clearly, and structure your response.",
  Search: "You summarize and synthesize known information accurately and concisely.",
  Chat: "You are a helpful, friendly AI assistant. Respond naturally and clearly."
};

export const DEFAULT_CONFIG: AppConfig = {
  activeModelId: 'qwen-2.5-coder-7b',
  reasoningModelId: 'phi-3-mini-reasoner',
  quantization: '4-bit',
  profile: 'Balanced',
  useCognitiveMemory: true,
  useGpu: true,
  voiceEnabled: false,

  // Default to the most offline-friendly option.
  // - 'webllm' runs fully on-device in the browser (WebGPU) once a model is downloaded.
  // - 'lmstudio' is great on desktop when you have a local server.
  // - 'native' is for a future native Android build (not Chrome).
  // - 'gemini' is the cloud fallback.
  provider: 'webllm',
  lmStudio: {
    baseUrl: 'http://localhost:1234/v1',
    apiKey: 'lm-studio',
    selectedModel: ''
  },
  webllm: {
    selectedModel: ''
  }
};

export const STORAGE_KEYS = {
  SESSIONS: 'nexus_sessions_v1',
  CONFIG: 'nexus_config_v1',
  COGNITIVE_MEMORY: 'nexus_vault_v1'
};
