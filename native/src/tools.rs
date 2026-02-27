
use std::collections::HashMap;

pub type ToolFn = fn(String) -> String;

pub struct ToolRegistry {
    tools: HashMap<String, ToolFn>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        let mut tools = HashMap::new();

        tools.insert("write_file".into(), write_file as ToolFn);
        tools.insert("read_file".into(), read_file as ToolFn);

        Self { tools }
    }

    pub fn call(&self, name: &str, input: String) -> Option<String> {
        self.tools.get(name).map(|f| f(input))
    }
}

fn write_file(input: String) -> String {
    // In a real mobile app, this would use a sandbox path
    // std::fs::write("workspace/output.txt", input).unwrap();
    "File written successfully in workspace vault.".into()
}

fn read_file(_: String) -> String {
    // "std::fs::read_to_string("workspace/output.txt").unwrap_or_default()"
    "Sample file content from neural vault.".into()
}
