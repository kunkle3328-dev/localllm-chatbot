
pub enum ModelKind {
    Fast,
    Coder,
    Reasoner,
}

pub fn model_path(kind: ModelKind) -> &'static str {
    match kind {
        ModelKind::Fast => "models/phi-2.q4.gguf",
        ModelKind::Coder => "models/qwen2.5-coder-7b.q4.gguf",
        ModelKind::Reasoner => "models/mistral-7b-instruct.q4.gguf",
    }
}
