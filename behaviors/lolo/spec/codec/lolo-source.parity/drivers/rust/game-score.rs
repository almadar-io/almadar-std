mod generated;
mod lolo;

use generated::entities::ScoreState;
use generated::events::{ScoreKeeperConfig, ScoreKeeperUNITS_CHANGEDPayload};
use serde::Deserialize;

#[derive(Deserialize)]
struct Step {
    event: String,
    payload: serde_json::Value,
}

#[derive(Deserialize)]
struct Spec {
    entity: serde_json::Value,
    config: ScoreKeeperConfig,
    steps: Vec<Step>,
}

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let mut t = lolo::ScoreKeeper::new(serde_json::from_value::<ScoreState>(spec.entity).expect("entity")).with_config(spec.config);
    for (i, step) in spec.steps.into_iter().enumerate() {
        let n = t.emitted.len();
        match step.event.as_str() {
            "INIT" => t.on_init(),
            "UNITS_CHANGED" => t.on_units_changed(&serde_json::from_value::<ScoreKeeperUNITS_CHANGEDPayload>(step.payload).expect("payload")),
            other => panic!("unknown event {}", other),
        }
        for (event, payload) in &t.emitted[n..] {
            println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
        }
        println!("{}", serde_json::json!({"step": i, "entity": &t.entity}));
    }
}
