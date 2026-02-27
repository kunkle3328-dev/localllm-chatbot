
use crate::router::TaskType;

pub fn system_prompt(task: TaskType) -> &'static str {
    match task {
        TaskType::Code =>
            "You are an expert software engineer. Respond with clean, correct, production-quality code. Use markdown and code blocks.",
        TaskType::Reasoning =>
            "You are a careful analytical assistant. Think step by step, explain clearly, and structure your response.",
        TaskType::Search =>
            "You summarize and synthesize known information accurately and concisely.",
        TaskType::Chat =>
            "You are a helpful, friendly AI assistant. Respond naturally and clearly.",
    }
}
