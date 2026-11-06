import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import ScoreState
from orbital_app.generated import events

spec = json.load(open(sys.argv[2]))
t = rendered.ScoreKeeper(ScoreState(**spec["entity"]), config=events.ScoreKeeperConfig(**spec["config"]))
for i, step in enumerate(spec["steps"]):
    n = len(t.emitted)
    if step["event"] == "INIT":
        t.on_init()
    else:
        t.on_units_changed(events.ScoreKeeperUNITS_CHANGEDPayload(**step["payload"]))
    for event, out in t.emitted[n:]:
        print(json.dumps({"step": i, "event": event, "payload": dataclasses.asdict(out)}, sort_keys=True))
    print(json.dumps({"step": i, "entity": dataclasses.asdict(t.entity)}, sort_keys=True))
