import json

URL = "http://127.0.0.1:24680/"


def step(frm, event, payload, state, emits, entity=None):
    s = {"from": frm, "event": event}
    if entity is not None:
        s["entity"] = entity
    s["payload"] = payload
    s["expect"] = {"state": state, "emits": emits}
    return s


def case(cid, steps):
    return {"id": cid, "steps": steps}


def emit(event, payload):
    return {"event": event, "payload": payload}


def write(path, atom, trait, note, cases):
    with open(path, "w") as f:
        json.dump({"atom": atom, "trait": trait, "note": note, "cases": cases}, f, indent=1, ensure_ascii=False)
        f.write("\n")
