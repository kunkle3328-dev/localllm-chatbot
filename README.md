
# NeuralPulse: Personal Offline AI Assistant

NeuralPulse is a mobile-first, identity-aware AI assistant that runs entirely on-device. It bypasses cloud APIs and external servers by using quantized GGUF models and a native Rust/llama.cpp inference engine.

## 🧠 Locked Model Stack (V1)

| Role | Model | Format | RAM Usage |
| :--- | :--- | :--- | :--- |
| **Core Intelligence** | Qwen 2.5 Coder 7B | GGUF Q4_K_M | ~4.7 GB |
| **Reasoning / Planning** | Phi-3 Mini (3.8B) | GGUF Q4 | ~2.2 GB |
| **Cognitive Memory** | BGE-Small-EN-v1.5 | Quantized | Negligible |

## 🏗️ Intelligence Architecture

### 1. Staged Reasoning
Instead of one massive model, NeuralPulse uses a tiered approach:
- **Plan Phase (Phi-3):** Decomposes complex user queries into logical sub-tasks.
- **Memory Phase (BGE):** Retrieves relevant user preferences and prior code from the local SQLite vault.
- **Execute Phase (Qwen):** Synthesizes the final output using personal context.

### 2. Personal Cognitive Memory (The Moat)
NeuralPulse learns from every interaction. It identifies:
- Preferred coding styles (functional vs object-oriented).
- Naming conventions.
- Recurring tasks.
- Personal preferences.

This data is stored in a local, private vector database (SQLite-based) and is impossible for cloud giants to replicate without compromising privacy.

## 🚀 Performance Orchestration
- **Streaming Tokens:** Mandatory < 300ms perceived latency for first-token delivery.
- **Context Compression:** Verbatim history for recent turns + sliding window summaries for long-term coherence.
- **Mobile Governor:** Dynamic thread and context adjustment based on device temperature and battery level.

## 🛠️ Build Plan
1. **Native Engine:** Integrate llama.cpp bindings in Rust.
2. **JSI Bridge:** Expose inference stream to React Native.
3. **UI Layer:** Professional ChatGPT-style formatting with virtualized lists.
4. **Cognitive Sync:** SQLite Vector store for local identity-aware RAG.
5. **Deployment:** ARM64 optimized binary for Android and iOS.

---
*NeuralPulse: Intelligence is Architecture, not Brute Force.*
