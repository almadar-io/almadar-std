import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import Ops

spec = json.load(open(sys.argv[2]))
probe = rendered.Probe(Ops(id="1"))
for i, step in enumerate(spec["steps"]):
    n = len(probe.emitted)
    getattr(probe, "on_" + step["event"].lower())(step["payload"])
    for event, out in probe.emitted[n:]:
        print(json.dumps({"step": i, "event": event, "payload": out}, sort_keys=True))
    print(json.dumps({"step": i, "entity": dataclasses.asdict(probe.entity)}, sort_keys=True))
