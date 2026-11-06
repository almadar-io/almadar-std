import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import LadderRequest, LadderVerdict
from orbital_app.generated import events


def plain(v):
    return dataclasses.asdict(v) if dataclasses.is_dataclass(v) else ({} if v is None else v)


spec = json.load(open(sys.argv[2]))
traits = {
    "LadderEntry": rendered.LadderEntry(LadderRequest(id="1")),
    "LadderVerdictSink": rendered.LadderVerdictSink(LadderVerdict(id="1")),
}
for i, step in enumerate(spec["steps"]):
    t = traits[step["trait"]]
    n = len(t.emitted)
    handler = getattr(t, "on_" + step["event"].lower())
    payload_type = getattr(events, step["trait"] + step["event"] + "Payload", None)
    if payload_type is None:
        handler()
    else:
        handler(payload_type(**step["payload"]))
    for event, out in t.emitted[n:]:
        print(json.dumps({"step": i, "event": event, "payload": plain(out)}, sort_keys=True))
    print(json.dumps({"step": i, "entity": dataclasses.asdict(t.entity)}, sort_keys=True))
