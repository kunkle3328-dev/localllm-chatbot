
use crate::models::{ModelKind, model_path};
use crate::Engine;

pub struct ModelManager {
    current: Option<ModelKind>,
    engine: Option<Engine>,
}

impl ModelManager {
    pub fn new() -> Self {
        Self { current: None, engine: None }
    }

    pub fn load(&mut self, kind: ModelKind) {
        if self.current == Some(kind) {
            return;
        }

        // Unload existing to save RAM before loading new
        self.engine = None; 
        let path = model_path(kind);
        
        // n_threads determined by safety.rs
        if let Ok(e) = Engine::new(path, 4) {
            self.engine = Some(e);
            self.current = Some(kind);
        }
    }

    pub fn engine_mut(&mut self) -> Option<&mut Engine> {
        self.engine.as_mut()
    }
}
