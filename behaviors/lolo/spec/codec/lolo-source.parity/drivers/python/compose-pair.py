import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import Match

spec = json.load(open(sys.argv[2]))
keys = ["ArenaOrbital.Arena", "ArenaOrbital.Score"]
program = rendered.Program({k: Match(id="1") for k in keys})
for i, step in enumerate(spec["steps"]):
    n = len(program.log)
    key = "ArenaOrbital." + step["trait"]
    program.dispatch(key, step["event"], step["payload"])
    for _trait, event, out in program.log[n:]:
        print(json.dumps({"step": i, "event": event, "payload": out}, sort_keys=True))
    print(json.dumps({"step": i, "entity": dataclasses.asdict(program.traits[key].entity)}, sort_keys=True))
