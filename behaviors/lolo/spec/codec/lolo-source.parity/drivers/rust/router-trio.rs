mod generated;
mod lolo;

use generated::entities::Tally;
use serde::Deserialize;

#[derive(Deserialize)]
struct Step {
    #[serde(rename = "trait")]
    trait_name: String,
    event: String,
    payload: serde_json::Value,
}

#[derive(Deserialize)]
struct Spec {
    steps: Vec<Step>,
}

fn row() -> Tally {
    serde_json::from_value(serde_json::json!({ "id": "1" })).expect("row")
}

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let mut program = lolo::Program::new((row(), row(), row()));
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = program.router.log.len();
        let key = format!("TrioOrbital.{}", step.trait_name);
        program.dispatch(&key, &step.event, step.payload);
        for (_, event, payload) in &program.router.log[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
        }
        println!("{}", serde_json::json!({"step": i, "entity": program.router.entity_of(&key)}));
    }
}
