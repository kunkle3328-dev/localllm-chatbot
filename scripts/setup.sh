
#!/bin/bash

echo "🚀 NEURAL PULSE SETUP"

echo "📂 Creating directories..."
mkdir -p models
mkdir -p storage

echo "📥 Downloading Core Model: Qwen 2.5 Coder 7B (GGUF Q4_K_M)..."
# Using huggingface-cli if available, otherwise curl
if command -v huggingface-cli &> /dev/null; then
    huggingface-cli download Qwen/Qwen2.5-Coder-7B-GGUF Qwen2.5-Coder-7B-GGUF.Q4_K_M.gguf --local-dir models
else
    curl -L -o models/qwen7b.gguf \
    https://huggingface.co/Qwen/Qwen2.5-Coder-7B-GGUF/resolve/main/Qwen2.5-Coder-7B-Coder-GGUF.Q4_K_M.gguf
fi

echo "📥 Downloading Reasoner Model: Phi-3 Mini (GGUF Q4)..."
curl -L -o models/phi3.gguf \
https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf

echo "🦀 Building Native Inference Engine..."
cd native
cargo build --release

echo "✅ Setup Complete. Run 'npm run start' for the app."
