
export type Role = 'user' | 'assistant' | 'system';
export type Quantization = '4-bit' | '6-bit' | '8-bit';
export type PerformanceMode = 'Eco' | 'Balanced' | 'Performance';

// Where the model runs
export type LLMProvider = 'gemini' | 'lmstudio' | 'native' | 'webllm';

export type TaskType = 'Code' | 'Reasoning' | 'Chat' | 'Search';

// Fix: Added missing APIConfig type required by lmStudioService.ts
export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
}

// Fix: Added missing LMStudioModel type required by lmStudioService.ts
export interface LMStudioModel {
  id: string;
  object?: string;
  owned_by?: string;
  [key: string]: any;
}

export interface Plan {
  steps: string[];
}

export interface ReasoningStep {
  label: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number;
}

export interface MemoryEntry {
  id: string;
  text: string;
  type: 'preference' | 'style' | 'knowledge' | 'task';
  timestamp: number;
  importance: number; // 0-1
  isPinned?: boolean;
}

export interface ToolCall {
  name: string;
  input: string;
  result?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  tokensPerSec?: number;
  reasoningSteps?: ReasoningStep[];
  sources?: string[]; 
  isPersonalized?: boolean;
  taskType?: TaskType;
  plan?: Plan;
  toolCalls?: ToolCall[];
}

export interface LocalModel {
  id: string;
  name: string;
  version: string;
  size: string;
  vramRequired: string;
  isDownloaded: boolean;
  description: string;
  role: 'Generalist' | 'Reasoning' | 'Embedding';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastModified: number;
  modelId: string;
  contextSummary?: string;
}

export interface DeviceStats {
  ramUsage: number; 
  totalRam: number;
  temp: number; 
  npuLoad: number;
  batteryLevel: number;
}

export interface AppConfig {
  activeModelId: string;
  reasoningModelId: string;
  quantization: Quantization;
  profile: PerformanceMode;
  useCognitiveMemory: boolean;
  useGpu: boolean;
  voiceEnabled: boolean;

  /** Which backend to use for chat completions. */
  provider: LLMProvider;

  /** Optional: stored locally; used only when provider === 'gemini'. */
  geminiApiKey?: string;

  /** Optional: used only when provider === 'lmstudio'. */
  lmStudio?: APIConfig;

  /** Optional: used only when provider === 'webllm' (in-browser/offline on device). */
  webllm?: {
    /** WebLLM model_id (prebuilt or custom MLC model). */
    selectedModel: string;
  };
}
