"""Replay the access-policy vectors through the resolved-input entrypoint."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
source = json.loads((spec_dir / 'mock-seed-access.replay.goldens.json').read_text())
for case in source['cases']:
    steps = case['steps']
    start = next(step for step in steps if step['event'] == 'DATASET_START')
    env = next(step for step in steps if step['event'] == 'DS_OWNS_ENV')
    read = next(step for step in steps if step['event'] == 'DS_PROGRAM_READ')
    pairs = []
    for part in env['payload'].get('value', '').split(','):
        parts = part.strip().split('.', 1)
        if len(parts) == 2 and all(parts):
            pairs.append({'entity': parts[0], 'column': parts[1]})
    payload = copy.deepcopy(start['payload'])
    payload.pop('source')
    payload.update(program=read['payload']['result'], ownerPairs=pairs)
    case['id'] = 'resolved-input: ' + case['id']
    case['steps'] = [step for step in steps if step['event'] == 'INIT'] + [{
        'event': 'DATASET_INPUT', 'payload': payload,
        'expect': {**read['expect'], 'fired': True,
                   'neverEmits': ['DS_OWNS_ENV', 'DS_OWNS_ENV_FAILED', 'DATASET_FAILED']},
    }]
explicit = next(case for case in source['cases'] if 'dataset-env-owner-columns' in case['id'])
controls = json.loads((spec_dir / 'mock-seed.replay.goldens.json').read_text())
control = next(case for case in controls['cases'] if case['id'] == 'dataset-control-an-unset-env-stamps-nothing')
assert explicit['steps'][-1]['payload']['program'] == control['steps'][-1]['payload']['result']
resolved_reset = copy.deepcopy(explicit['steps'][-1])
resolved_reset['payload']['ownerPairs'] = []
resolved_reset['expect'] = control['steps'][-1]['expect']
source['cases'].extend([
    {'id': 'repeat-resolved-input-resets-owner-pairs',
     'steps': copy.deepcopy(explicit['steps']) + [resolved_reset]},
    {'id': 'legacy-source-resets-explicit-owner-pairs',
     'steps': copy.deepcopy(explicit['steps']) + copy.deepcopy(control['steps'][1:])},
])
with tempfile.NamedTemporaryFile(mode='w', suffix='.replay.goldens.json', prefix='mock-seed-input-access-', dir=spec_dir, delete=False) as output:
    json.dump(source, output, ensure_ascii=False)
    path = Path(output.name)
try:
    raise SystemExit(subprocess.run([os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb')), 'goldens', os.path.relpath(path)]).returncode)
finally:
    path.unlink()
