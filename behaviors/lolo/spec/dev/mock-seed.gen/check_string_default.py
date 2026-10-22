"""Check the sampler's string-default expression with native validation and replay."""
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
expression = sampler.string_default('?value')
source = '''app seed-string-probe [version: "1.0.0"]
type MockValue = string | number | boolean | [MockValue?] | Map string MockValue?
orbital SeedStringProbe {
  entity SeedStringCell [runtime] {
    id : string!
    out : string = ""
  }
  trait Run -> SeedStringCell [integration] {
    initial: ready
    state ready {
      INIT -> ready
        (render-ui main { type: typography, content: "Seed string default probe" })
      ASK -> ready
        (set @entity.out EXPRESSION)
        (emit DONE { value: @entity.out })
    }
    listens {
      ASK { value : MockValue! }
        @description "Sample a string default."
    }
    emits {
      DONE -> external { value : string! }
        @description "The sampled text."
    }
  }
  page "/seed-string-probe" as SeedStringProbePage -> Run
}
'''.replace('EXPRESSION', expression)
with tempfile.NamedTemporaryFile(mode='w', suffix='.lolo', prefix='.seed-string-probe-', dir=spec_dir, delete=False) as output:
    output.write(source)
    atom = Path(output.name)
with tempfile.NamedTemporaryFile(mode='w', suffix='.replay.goldens.json', prefix='.seed-string-probe-', dir=spec_dir, delete=False) as output:
    values = ['hello', '"quoted"', 'back\\slash', 'line\nnext', 'نور café 🌍', '{{value}}', '', 123, False, {'key': 'value'}]
    golden = {'atom': 'spec/dev/' + atom.name, 'trait': 'Run', 'cases': [{
        'id': 'string-default-' + str(index),
        'steps': [{'event': 'ASK', 'payload': {'value': value}, 'expect': {
            'fired': True, 'emits': [{'event': 'DONE', 'payload': {'value': value if isinstance(value, str) else ''}}],
            'emitCounts': {'DONE': 1},
        }}],
    } for index, value in enumerate(values)]}
    json.dump(golden, output, ensure_ascii=False)
    replay = Path(output.name)
try:
    checked = subprocess.run([orb, 'validate', os.path.relpath(atom)])
    if checked.returncode:
        raise SystemExit(checked.returncode)
    raise SystemExit(subprocess.run([orb, 'goldens', os.path.relpath(replay)]).returncode)
finally:
    atom.unlink()
    replay.unlink()
