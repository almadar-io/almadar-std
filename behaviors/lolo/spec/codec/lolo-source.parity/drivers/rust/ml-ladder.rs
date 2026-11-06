mod generated;
mod lolo;

use generated::entities::{LadderRequest, LadderVerdict};
use generated::events::*;
use serde::Deserialize;
use serde::de::DeserializeOwned;

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

fn p<T: DeserializeOwned>(v: &serde_json::Value) -> T {
    serde_json::from_value(v.clone()).expect("payload")
}

fn print(i: usize, emitted: &[(String, Option<serde_json::Value>)], entity: serde_json::Value) {
    for (event, payload) in emitted {
        let payload = payload.clone().unwrap_or_else(|| serde_json::json!({}));
        println!("{}", serde_json::json!({"step": i, "event": event, "payload": payload}));
    }
    println!("{}", serde_json::json!({"step": i, "entity": entity}));
}

fn main() {
    let path = std::env::args().nth(1).expect("events file argument");
    let spec: Spec = serde_json::from_str(&std::fs::read_to_string(path).expect("read events")).expect("parse events");
    let row = serde_json::json!({ "id": "1" });
    let mut entry = lolo::LadderEntry::new(serde_json::from_value::<LadderRequest>(row.clone()).expect("request row"));
    let mut sink = lolo::LadderVerdictSink::new(serde_json::from_value::<LadderVerdict>(row).expect("verdict row"));
    for (i, step) in spec.steps.into_iter().enumerate() {
        if step.trait_name == "LadderEntry" {
            let n = entry.emitted.len();
            match step.event.as_str() {
                "INIT" => entry.on_init(),
                "RESET" => entry.on_reset(),
                "DECIDE" => entry.on_decide(&p::<LadderEntryDECIDEPayload>(&step.payload)),
                other => panic!("unknown event {}", other),
            }
            print(i, &entry.emitted[n..], serde_json::to_value(&entry.entity).expect("row"));
        } else {
            let n = sink.emitted.len();
            match step.event.as_str() {
                "INIT" => sink.on_init(),
                "RESET" => sink.on_reset(),
                "FROM_EXACT" => sink.on_from_exact(&p::<LadderVerdictSinkFROM_EXACTPayload>(&step.payload)),
                "FROM_LOOKUP" => sink.on_from_lookup(&p::<LadderVerdictSinkFROM_LOOKUPPayload>(&step.payload)),
                "FROM_SIMILARITY" => sink.on_from_similarity(&p::<LadderVerdictSinkFROM_SIMILARITYPayload>(&step.payload)),
                "FROM_INFER" => sink.on_from_infer(&p::<LadderVerdictSinkFROM_INFERPayload>(&step.payload)),
                "FROM_CLASSIFY" => sink.on_from_classify(&p::<LadderVerdictSinkFROM_CLASSIFYPayload>(&step.payload)),
                "FROM_CLASSIFY_FAILURE" => sink.on_from_classify_failure(&p::<LadderVerdictSinkFROM_CLASSIFY_FAILUREPayload>(&step.payload)),
                other => panic!("unknown event {}", other),
            }
            print(i, &sink.emitted[n..], serde_json::to_value(&sink.entity).expect("row"));
        }
    }
}
