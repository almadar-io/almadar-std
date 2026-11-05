mod generated;
mod jsonvalue_gap;
mod lolo;

use generated::entities::Doc;
use generated::events::{ChunkCHUNKPayload};
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
    let mut t = lolo::Chunk::new(serde_json::from_value::<Doc>(spec.entity).expect("entity"));
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = t.emitted.len();
        match step.event.as_str() {
            "CHUNK" => t.on_chunk(&serde_json::from_value::<ChunkCHUNKPayload>(step.payload).expect("payload")),
            other => panic!("unknown event {}", other),
        }
        for (event, payload) in &t.emitted[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
        }
    }
}
