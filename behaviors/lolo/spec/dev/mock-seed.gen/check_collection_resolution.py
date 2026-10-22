"""Declared entity/store metadata applies equally to authored and generated rows."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
with tempfile.NamedTemporaryFile(suffix='.orb', prefix='seed-collection-', delete=False) as out:
    path = Path(out.name)
try:
    emitted = subprocess.run([orb, 'emit', 'orb', str(spec_dir / 'mock-seed-access.fixture.lolo'),
                              '--output', str(path)], capture_output=True, text=True)
    assert emitted.returncode == 0, emitted.stdout + emitted.stderr
    for collection in ['fixtureviewer', 'accounts']:
        for authored in [False, True]:
            identity = {'name': 'FixtureViewer', 'identity': True, 'collection': collection,
                        'fields': [{'name': 'id', 'type': 'string', 'required': True}]}
            if authored:
                identity['instances'] = [{'id': 'authored'}]
            program = {'orbitals': [{'entity': identity}, {'entity': {'name': 'Task',
                'collection': 'tasks', 'fields': [{'name': 'id', 'type': 'string'},
                    {'name': 'ownerRef', 'type': 'relation',
                     'relation': {'entity': 'FixtureViewer', 'cardinality': 'one'}}]}}]}
            step = {'trait': 'MockSeed', 'event': 'DATASET_INPUT', 'payload': {
                'program': program, 'count': 1, 'seed': 1, 'nowMs': 0,
                'viewerId': 'viewer', 'ownerPairs': [{'entity': 'Task', 'column': 'ownerRef'}]}}
            played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps([step])],
                                    capture_output=True, text=True)
            assert played.returncode == 0, played.stdout + played.stderr
            report = json.loads(played.stdout)
            assert report.get('success') is True, report
            result = report['steps'][0]
            links = result['entityAfter']['dsLinks']
            assert len(links) == 1 and links[0]['target'] == collection, {
                'collection': collection, 'authored': authored, 'links': links}
            print('pass: declared collection=' + collection + ' authored=' + str(authored), flush=True)
    for target in ['FixtureViewer', 'Unregistered']:
        schema = {'name': 'relation-target-control', 'version': '1.0.0', 'orbitals': [{
            'name': 'TaskOrbital', 'entity': {'name': 'Task', 'persistence': 'persistent',
                'fields': [{'name': 'id', 'type': 'string', 'required': True},
                    {'name': 'ownerRef', 'type': 'relation',
                     'relation': {'entity': target, 'cardinality': 'one'}}]},
            'auxiliaryEntities': [{'name': 'FixtureViewer', 'persistence': 'persistent',
                                   'fields': [{'name': 'id', 'type': 'string', 'required': True}]}],
            'traits': [], 'pages': []}]}
        with tempfile.NamedTemporaryFile(mode='w', suffix='.orb', prefix='seed-relation-',
                                          delete=False) as control:
            json.dump(schema, control)
            control_path = Path(control.name)
        try:
            checked = subprocess.run([orb, 'validate', str(control_path), '--json'],
                                     capture_output=True, text=True)
            findings = json.loads(checked.stdout)
            relation_errors = [e for e in findings.get('errors', [])
                               if e['code'] == 'ORB_E_INVALID_RELATION']
            assert bool(relation_errors) == (target == 'Unregistered'), findings
            if relation_errors:
                assert "'Unregistered' does not exist" in relation_errors[0]['message'], relation_errors
            print('pass: validator relation target=' + target, flush=True)
        finally:
            control_path.unlink()
finally:
    path.unlink()
