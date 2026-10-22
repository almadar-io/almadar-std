"""Play native grant selection against the canonical emitted program-host source."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent
source = spec_dir.parent.parent / 'ops' / 'atoms' / 'std-program-host.lolo'
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
grants = {'fs': ['workspace/**'], 'exec': ['echo']}

def request(selected, initial=False, configured=True):
    step = {'trait': 'ProgramHost', 'from': 'parsing', 'event': 'HOST_ARGS_DONE',
            'payload': {'stage': 'host', 'flags': {} if selected is None else {'grant': selected},
                        'positionals': ['guest.lolo'], 'errors': [], 'words': []}}
    if initial:
        step['entity'] = {'id': 'host', 'path': '', 'loaded': False, 'grants': {}}
    if configured:
        step['config'] = {'guestGrants': grants}
    return step

cases = [
    ('default-is-no-grants', [request(None, True, False)], [{}], False),
    ('no-flags-preserves-all-declared-guest-grants', [request(None, True)], [grants], False),
    ('selected-kind-preserves-exact-patterns', [request(['fs'], True)], [{'fs': grants['fs']}], False),
    ('empty-selection-preserves-all-declared-grants', [request([], True)], [grants], False),
    ('unknown-kind-is-refused', [request(['net'], True)], [{}], True),
    ('repeat-selection-starts-from-configured-grants', [request(['fs'], True), request(['exec'])],
     [{'fs': grants['fs']}, {'exec': grants['exec']}], False),
]
with tempfile.NamedTemporaryFile(mode='w', suffix='.orb', prefix='program-host-grants-', delete=False) as output:
    path = Path(output.name)
try:
    emitted = subprocess.run([orb, 'emit', 'orb', os.path.relpath(source), '--output', str(path)], capture_output=True, text=True)
    assert emitted.returncode == 0, emitted.stdout + emitted.stderr
    for label, steps, expected, refused in cases:
        played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps(steps)], capture_output=True, text=True)
        assert played.returncode == 0, played.stdout + played.stderr
        report = json.loads(played.stdout)
        assert report.get('success') is True, report
        actual = [step['entityAfter']['grants'] for step in report['steps']]
        assert actual == expected, {'case': label, 'actual': actual, 'expected': expected}
        emits = [event for step in report['steps'] for outcome in step['outcomes'] for event in outcome['emits']]
        assert any(event['event'] == 'HOST_REFUSED' for event in emits) == refused, {'case': label, 'emits': emits}
        if refused:
            assert any(event['event'] == 'HOST_COMMAND_ANSWERED' and event['payload']['status'] == 400 for event in emits), emits
        print('pass: ' + label, flush=True)
finally:
    path.unlink()
