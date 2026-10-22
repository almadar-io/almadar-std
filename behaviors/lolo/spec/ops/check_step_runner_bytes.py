"""Assert canonical STEP_RAN byte payload refusals before the step arm runs."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent
source = json.loads((spec_dir / 'step-runner.replay.goldens.json').read_text())
base = next(case for case in source['cases'] if case['id'] == 'raw-output-keeps-bytes')
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
expected = "Payload validation failed for event 'STEP_RAN': stdoutBytes (wrong-type, expected bytes)"
for label, value in [('malformed-alphabet', '!!not-base64'), ('noncanonical-padding', 'YQ'), ('non-byte-number', 12)]:
    case = copy.deepcopy(base)
    case['id'] = label
    case['steps'][-1]['payload']['stdoutBytes'] = value
    case['steps'][-1]['expect'] = {'fired': False, 'neverEmits': ['STEPS_DONE', 'STEPS_FAILED']}
    with tempfile.NamedTemporaryFile(mode='w', suffix='.replay.goldens.json', prefix='.step-runner-byte-refusal-', dir=spec_dir, delete=False) as output:
        json.dump({'atom': source['atom'], 'trait': source['trait'], 'cases': [case]}, output)
        path = Path(output.name)
    try:
        result = subprocess.run([orb, 'goldens', os.path.relpath(path)], capture_output=True, text=True)
        print('Expected canonical byte refusal: ' + label, flush=True)
        print(result.stdout, end='', flush=True)
        print(result.stderr, end='', flush=True)
        assert result.returncode == 1 and expected in result.stdout, label + ': canonical byte refusal was not observed'
        print('pass: ' + label + ' was refused before dispatch', flush=True)
    finally:
        path.unlink()
