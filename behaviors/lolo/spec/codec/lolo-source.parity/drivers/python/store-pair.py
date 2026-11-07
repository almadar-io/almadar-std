import dataclasses
import json
import sys

sys.path[:0] = [sys.argv[1]]
import rendered
from orbital_app.generated.entities import Note

spec = json.load(open(sys.argv[2]))
key = "StoreOrbital.Notes"
program = rendered.Program({key: Note(id="1")}, rendered.MemoryStore())
for i, step in enumerate(spec["steps"]):
    n = len(program.log)
    program.dispatch("StoreOrbital." + step["trait"], step["event"], step["payload"])
    for _trait, event, out in program.log[n:]:
        print(json.dumps({"step": i, "event": event, "payload": out}, sort_keys=True))
    print(json.dumps({"step": i, "entity": dataclasses.asdict(program.traits[key].entity)}, sort_keys=True))
