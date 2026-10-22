"""Validate and replay the sampler's zero-or-one-cell step result."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
import sampler

spec_dir = Path(__file__).resolve().parent.parent
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
skip = sampler.res(None, '[{ name: "next" }]', '?rng')
keep = sampler.res(sampler.cell('"root"', '"string"', '"value"'), s='?rng')
source = '''app seed-step-probe [version: "1.0.0"]
type ProbeCell = { path : string!, kind : string!, text : string!, num : number! }
type ProbeFrame = { name : string! }
type ProbeResult = { cells : [ProbeCell]!, push : [ProbeFrame]!, s : number! }
orbital SeedStepProbe {
  entity SeedStepCell [runtime] {
    id : string!
    result : ProbeResult = { cells: [], push: [], s: 0 }
  }
  trait Run -> SeedStepCell [integration] {
    initial: ready
    state ready {
      INIT -> ready
        (render-ui main { type: typography, content: "Seed step result probe" })
      ASK -> ready
        (set @entity.result EXPRESSION)
        (emit DONE { cells: (object/get @entity.result "cells"), push: (object/get @entity.result "push"), s: (object/get @entity.result "s") })
    }
    listens {
      ASK { skip : boolean! rng : number! }
        @description "Complete a sampler step."
    }
    emits {
      DONE -> external { cells : [ProbeCell]!, push : [ProbeFrame]!, s : number! }
        @description "The step's emitted cells, continuation and unchanged random state."
    }
  }
  page "/seed-step-probe" as SeedStepProbePage -> Run
}
'''.replace('EXPRESSION', f'(if ?skip {skip} {keep})')
with tempfile.NamedTemporaryFile(mode='w', suffix='.lolo', prefix='.seed-step-probe-', dir=spec_dir, delete=False) as output:
    output.write(source)
    atom = Path(output.name)
with tempfile.NamedTemporaryFile(mode='w', suffix='.replay.goldens.json', prefix='.seed-step-probe-', dir=spec_dir, delete=False) as output:
    golden = {'atom': 'spec/dev/' + atom.name, 'trait': 'Run', 'cases': []}
    for skip_value in [True, False]:
        for rng in [0, 42]:
            result = {'cells': [] if skip_value else [{'path': 'root', 'kind': 'string', 'text': 'value', 'num': 0}], 'push': [{'name': 'next'}] if skip_value else [], 's': rng}
            golden['cases'].append({'id': f'step-{skip_value}-{rng}', 'steps': [{'event': 'ASK', 'payload': {'skip': skip_value, 'rng': rng}, 'expect': {'fired': True, 'emits': [{'event': 'DONE', 'payload': result}], 'emitCounts': {'DONE': 1}}}]})
    json.dump(golden, output)
    replay = Path(output.name)
try:
    checked = subprocess.run([orb, 'validate', os.path.relpath(atom)])
    if checked.returncode:
        raise SystemExit(checked.returncode)
    raise SystemExit(subprocess.run([orb, 'goldens', os.path.relpath(replay)]).returncode)
finally:
    atom.unlink()
    replay.unlink()
