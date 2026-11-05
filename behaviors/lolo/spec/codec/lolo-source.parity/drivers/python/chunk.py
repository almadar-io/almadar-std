import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import Doc
from orbital_app.generated import events

spec = json.load(open(sys.argv[2]))
t = rendered.Chunk(Doc(**spec["entity"]))
for i, step in enumerate(spec["steps"]):
    n = len(t.emitted)
    payload = getattr(events, "Chunk" + step["event"] + "Payload")(**step["payload"])
    getattr(t, "on_" + step["event"].lower())(payload)
    for event, out in t.emitted[n:]:
        print(json.dumps({"step": i, "event": event, "payload": dataclasses.asdict(out)}, sort_keys=True))
