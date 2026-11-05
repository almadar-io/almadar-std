mod generated;
mod lolo;

use generated::entities::Run;
use generated::events::{LoopTOOL_CHOSENPayload, LoopTOOL_RESULTPayload, LoopFINALPayload};
use serde::Deserialize;

#[derive(Deserialize)]
struct Step {
    event: String,
    payload: serde_json::Value,
}

#[derive(Deserialize)]
struct Spec {
    entity: serde_json::Value,
    steps: Vec<Step>,
}

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let mut t = lolo::Loop::new(serde_json::from_value::<Run>(spec.entity).expect("entity"));
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = t.emitted.len();
        match step.event.as_str() {
            "TOOL_CHOSEN" => t.on_tool_chosen(&serde_json::from_value::<LoopTOOL_CHOSENPayload>(step.payload).expect("payload")),
            "TOOL_RESULT" => t.on_tool_result(&serde_json::from_value::<LoopTOOL_RESULTPayload>(step.payload).expect("payload")),
            "FINAL" => t.on_final(&serde_json::from_value::<LoopFINALPayload>(step.payload).expect("payload")),
            other => panic!("unknown event {}", other),
        }
        for (event, payload) in &t.emitted[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
        }
    }
}
