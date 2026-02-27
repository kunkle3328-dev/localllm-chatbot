
use crate::agent::Plan;

pub fn execute(plan: Plan, user_prompt: &str) -> String {
    let mut context = String::new();

    for step in plan.steps {
        context.push_str(&format!("Step: {}\n", step));
    }

    context.push_str("\nUser Request:\n");
    context.push_str(user_prompt);

    context
}
