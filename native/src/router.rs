
pub enum TaskType {
    Code,
    Reasoning,
    Chat,
    Search,
}

pub fn classify(prompt: &str) -> TaskType {
    let p = prompt.to_lowercase();

    if p.contains("write code")
        || p.contains("function")
        || p.contains("bug")
        || p.contains("typescript")
        || p.contains("rust")
        || p.contains("code")
    {
        TaskType::Code
    } else if p.contains("why")
        || p.contains("explain")
        || p.contains("analyze")
        || p.contains("reason")
    {
        TaskType::Reasoning
    } else if p.contains("search")
        || p.contains("find")
        || p.contains("lookup")
    {
        TaskType::Search
    } else {
        TaskType::Chat
    }
}
