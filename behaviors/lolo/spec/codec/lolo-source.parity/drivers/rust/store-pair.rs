mod generated;
mod lolo;

use generated::entities::Note;
use lolo::Store;
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

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let row: Note = serde_json::from_value(serde_json::json!({ "id": "1" })).expect("row");
    let store: std::rc::Rc<std::cell::RefCell<dyn Store>> = std::rc::Rc::new(std::cell::RefCell::new(lolo::MemoryStore::default()));
    let mut program = lolo::Program::new((row,), store);
    let key = "StoreOrbital.Notes";
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = program.router.log.len();
        program.dispatch(&format!("StoreOrbital.{}", step.trait_name), &step.event, step.payload);
        for (_, event, payload) in &program.router.log[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
        }
        println!("{}", serde_json::json!({"step": i, "entity": program.router.entity_of(key)}));
    }
}
