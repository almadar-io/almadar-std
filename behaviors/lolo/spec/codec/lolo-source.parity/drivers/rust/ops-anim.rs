mod generated;
mod lolo;

use generated::entities::Ops;
use serde::Deserialize;

#[derive(Deserialize)]
struct Step {
    event: String,
}

#[derive(Deserialize)]
struct Spec {
    steps: Vec<Step>,
}

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let row: Ops = serde_json::from_value(serde_json::json!({ "id": "1" })).expect("row");
    let mut probe = lolo::Probe::new(row);
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = probe.emitted.len();
        assert_eq!(step.event, "INIT", "the operator fixtures dispatch INIT only");
        probe.on_init();
        for (event, payload) in &probe.emitted[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload.clone().unwrap_or(serde_json::Value::Object(Default::default()))}));
        }
        println!("{}", serde_json::json!({"step": i, "entity": probe.entity}));
    }
}
