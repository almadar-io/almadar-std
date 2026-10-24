"""Authored IDs reach minting or candidate admission without unsafe comparison."""
import ast
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
tree = ast.parse((Path(__file__).parent / 'gen_atom.py').read_text())
owner = next(node for node in tree.body if isinstance(node, ast.Assign)
             and any(isinstance(target, ast.Name) and target.id == 'blank'
                     for target in node.targets))
scope = {}
exec(compile(ast.Module(body=[owner], type_ignores=[]), 'blank-owner', 'exec'), scope)
predicate = scope['blank']('?row')
probe = '''app authored-id-predicate [version: "1.0.0"]
type MockValue = string | number | boolean | [MockValue?] | Map string MockValue?
orbital Predicate {
  entity Probe [runtime] { id : string! }
  trait Check -> Probe {
    initial: ready
    state ready { CHECK -> ready (emit CHECKED { blank: PREDICATE }) }
    listens { CHECK -> input { row : Map string MockValue?! } }
    emits { CHECKED -> external { blank : boolean! } }
  }
  page boot as PredicateStart -> Check
}
'''.replace('PREDICATE', predicate)
rows = [{}, {'id': ''}, {'id': '007'}, {'id': 12}, {'id': True},
        {'id': None}, {'id': []}, {'id': {}}]


def events(result):
    return [event for outcome in result['outcomes'] for event in outcome['emits']]


def execute(path, steps):
    played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps(steps)],
                            capture_output=True, text=True)
    assert played.returncode == 0, played.stdout + played.stderr
    report = json.loads(played.stdout)
    assert report.get('success') is True, report
    return report['steps']


with tempfile.TemporaryDirectory(prefix='seed-authored-ids-') as temporary:
    directory = Path(temporary)
    source = directory / 'predicate.lolo'
    source.write_text(probe)
    lowered = directory / 'predicate.orb'
    emitted = subprocess.run([orb, 'emit', 'orb', str(source), '--output', str(lowered)],
                             capture_output=True, text=True)
    assert emitted.returncode == 0, emitted.stdout + emitted.stderr
    checked = execute(lowered, [{'trait': 'Check', 'event': 'CHECK', 'payload': {'row': row}}
                                for row in rows])
    for index, (row, result) in enumerate(zip(rows, checked)):
        assert events(result) == [{'event': 'CHECKED', 'payload': {'blank': index < 2}}], result
        print('pass: guarded authored-ID predicate row=' + json.dumps(row), flush=True)

    fixture = directory / 'fixture.orb'
    emitted = subprocess.run([orb, 'emit', 'orb', str(spec_dir / 'mock-seed-access.fixture.lolo'),
                              '--output', str(fixture)], capture_output=True, text=True)
    assert emitted.returncode == 0, emitted.stdout + emitted.stderr
    for index, row in enumerate(rows):
        program = {'orbitals': [{'entity': {'name': 'FixtureViewer', 'identity': True,
            'collection': 'accounts', 'fields': [{'name': 'id', 'type': 'string'}],
            'instances': [row]}}]}
        payload = {'program': program, 'count': 1, 'seed': 1, 'nowMs': 0,
                   'viewerId': 'viewer', 'ownerPairs': []}
        result = execute(fixture, [{'trait': 'MockSeed', 'event': 'DATASET_INPUT',
                                    'payload': payload}])[0]
        done = [event['payload'] for event in events(result) if event['event'] == 'DATASET_DONE']
        assert len(done) == 1, result
        expected = 'FixtureViewer Id 1' if index < 2 else row['id']
        assert done[0]['stores']['accounts'][0]['id'] == expected, done
        assert not any(event['event'] == 'DATASET_FAILED' for event in events(result)), result
        print('pass: authored DATASET_INPUT row=' + json.dumps(row), flush=True)

    for value in [[], {}]:
        program = {'orbitals': [{'entity': {'name': 'FixtureViewer', 'identity': True,
            'collection': 'accounts', 'fields': [{'name': 'id', 'type': 'string'}],
            'instances': [{'id': value}]}}, {'entity': {'name': 'Task', 'collection': 'tasks',
            'fields': [{'name': 'id', 'type': 'string'}, {'name': 'ownerRef', 'type': 'relation',
                'relation': {'entity': 'FixtureViewer', 'cardinality': 'one'}}]}}]}
        payload = {'program': program, 'count': 1, 'seed': 1, 'nowMs': 0, 'viewerId': 'viewer',
                   'ownerPairs': [{'entity': 'Task', 'column': 'ownerRef'}]}
        result = execute(fixture, [{'trait': 'MockSeed', 'event': 'DATASET_INPUT',
                                    'payload': payload}])[0]
        reference = subprocess.run([orb, 'evaluate', '["str/concat","","@payload.id"]',
            '--payload', json.dumps({'id': value}), '--output', 'json'],
            capture_output=True, text=True)
        prefix = 'Error: Evaluation error: Evaluation error: '
        assert reference.returncode != 0 and reference.stderr.startswith(prefix), reference.stderr
        reason = reference.stderr[len(prefix):].strip()
        assert [event['payload'] for event in events(result)
                if event['event'] == 'DATASET_FAILED'] == [{'error': reason}], result
        assert not any(event['event'] in ['DATASET_DONE', 'RESTAMP_DONE']
                       for event in events(result)), result
        print('pass: consumed authored compound ID refuses id=' + json.dumps(value), flush=True)
