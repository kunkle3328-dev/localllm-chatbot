
pub fn detect_tool_call(text: &str) -> Option<(String, String)> {
    if text.starts_with("tool:") {
        let parts: Vec<&str> = text.splitn(3, ':').collect();
        if parts.len() == 3 {
            return Some((parts[1].into(), parts[2].into()));
        }
    }
    None
}
