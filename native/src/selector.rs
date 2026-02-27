
use crate::router::TaskType;
use crate::models::ModelKind;

pub fn select_model(task: TaskType) -> ModelKind {
    match task {
        TaskType::Code => ModelKind::Coder,
        TaskType::Reasoning => ModelKind::Reasoner,
        _ => ModelKind::Fast,
    }
}
