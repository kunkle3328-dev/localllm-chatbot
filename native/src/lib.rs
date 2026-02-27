
use crossbeam_channel::Sender;
use llama_cpp_rs::{LlamaModel, LlamaParams};

pub mod ffi;

pub struct Engine {
    model: LlamaModel,
}

impl Engine {
    pub fn new(model_path: &str, threads: i32) -> anyhow::Result<Self> {
        let mut params = LlamaParams::default();
        params.n_threads = threads;

        let model = LlamaModel::load_from_file(model_path, params)?;
        Ok(Self { model })
    }

    pub fn generate_stream(
        &mut self,
        prompt: &str,
        token_tx: Sender<String>,
    ) -> anyhow::Result<()> {
        self.model.infer(prompt, |token| {
            let _ = token_tx.send(token.to_string());
            true
        })?;
        Ok(())
    }
}
