"""Check exact identity candidates, native scalar formatting and terminal refusal."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
source = spec_dir / 'mock-seed-access.fixture.lolo'
program = {'orbitals': []}
empty_journal = {'viewerId': '', 'stamped': [], 'deferred': []}


def registry(label, store, fields):
    return {'label': label, 'store': store, 'fields': fields, 'identity': False,
            'runtime': False, 'seeds': True, 'ownerCols': [],
            'policyEntity': label, 'hasRead': False, 'instances': []}


def entity(mode, value):
    return {'id': 'host', 'dsMode': mode, 'dsViewer': 'viewer',
            'dsRegsAll': [registry('Task', 'tasks', [{'name': 'ownerRef', 'type': 'relation',
                'relation': {'entity': 'FixtureViewer', 'cardinality': 'one'}}]),
                registry('FixtureViewer', 'fixtureviewers', [])],
            'dsStores': {'tasks': [{'id': 'task'}], 'fixtureviewers': [{'id': value}],
                         'unconsumed': [{'id': {'not': 'a consumed identity'}}]},
            'dsStamps': [{'store': 'tasks', 'i': 0, 'col': 'ownerRef'}],
            'dsOlinks': [{'store': 'tasks', 'i': 0, 'field': 'ownerRef',
                          'target': 'fixtureviewers', 'scalar': True}],
            'rsJournal': copy.deepcopy(empty_journal), 'rsChanges': []}


def reset(mode):
    if mode == 'seed':
        return {'event': 'DATASET_INPUT', 'payload': {'program': program, 'count': 0,
            'seed': 1, 'nowMs': 0, 'viewerId': '', 'ownerPairs': []}}
    return {'event': 'RESTAMP_INPUT', 'payload': {'program': program, 'stores': {},
        'journal': empty_journal, 'viewer': {'id': ''}, 'firstOwner': True}}


def emitted(step):
    return [item for outcome in step['outcomes'] for item in outcome['emits']]


with tempfile.NamedTemporaryFile(suffix='.orb', prefix='mock-seed-scalar-', delete=False) as out:
    path = Path(out.name)
try:
    lowered = subprocess.run([orb, 'emit', 'orb', str(source), '--output', str(path)],
                             capture_output=True, text=True)
    assert lowered.returncode == 0, lowered.stdout + lowered.stderr
    for mode in ['seed', 'restamp']:
        for event in ['DS_STAMP', 'DS_OLINK']:
            for value in ['007', 12, True, None, [], {}]:
                reference = subprocess.run([orb, 'evaluate', '["str/concat","","@payload.id"]',
                    '--payload', json.dumps({'id': value}), '--output', 'json'],
                    capture_output=True, text=True)
                compound = isinstance(value, (list, dict))
                assert (reference.returncode != 0) == compound, reference
                initial = entity(mode, value)
                if event == 'DS_STAMP':
                    initial['dsOlinks'] = []
                else:
                    initial['dsStamps'] = []
                steps = [{'trait': 'MockSeed', 'event': event, 'payload': {'at': 1},
                          'entity': initial}]
                if compound:
                    steps.extend({'trait': 'MockSeed', 'event': name, 'payload': payload}
                        for name, payload in [('AC_DONE', {'at': 0}), ('DS_PROJS', {'at': 0}),
                            ('DS_STAMP', {'at': 0}), ('DS_OLINK', {'at': 0}),
                            ('DS_STORE', {'at': 0}), ('AC_ASK', {'at': 0}),
                            ('AC_ANSWER', {'allowed': True}),
                            ('DS_PROGRAM_READ', {'result': program})])
                    steps.append({'trait': 'MockSeed', 'event': 'DERIVE_OWNERS',
                                  'payload': {'result': program}})
                    steps.extend(dict(reset(mode), trait='MockSeed') for _ in range(2))
                played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps(steps)],
                                        capture_output=True, text=True)
                assert played.returncode == 0, played.stdout + played.stderr
                report = json.loads(played.stdout)
                assert report.get('success') is True, {'mode': mode, 'event': event,
                    'value': value, 'report': report}
                first = report['steps'][0]
                if not compound:
                    assert first['entityAfter']['acIds'] == [json.loads(reference.stdout)], first
                    assert not any(x['event'] == 'DATASET_FAILED' for x in emitted(first)), first
                    assert first['entityAfter']['dsStores']['unconsumed'] == initial['dsStores']['unconsumed'], first
                else:
                    prefix = 'Error: Evaluation error: Evaluation error: '
                    assert reference.stderr.startswith(prefix), reference.stderr
                    reason = reference.stderr[len(prefix):].strip()
                    failures = [x['payload'] for x in emitted(first) if x['event'] == 'DATASET_FAILED']
                    assert failures == [{'error': reason}], {'actual': failures, 'reference': reason}
                    failed_steps = report['steps'][:-2]
                    for result in failed_steps:
                        assert not any(x['event'] in ['DATASET_DONE', 'RESTAMP_DONE', 'AC_ASK']
                                       for x in emitted(result)), result
                        assert result['entityAfter']['dsMode'] == 'failed', result
                        assert result['entityAfter']['rsChanges'] == [], result
                    assert any(x['event'] == 'OWNERS_DERIVED'
                               for x in emitted(report['steps'][-3])), report['steps'][-3]
                    success = 'DATASET_DONE' if mode == 'seed' else 'RESTAMP_DONE'
                    for result in report['steps'][-2:]:
                        assert sum(x['event'] == success for x in emitted(result)) == 1, result
                        assert not any(x['event'] == 'DATASET_FAILED' for x in emitted(result)), result
                print('pass: ' + mode + ' ' + event + ' id=' + json.dumps(value), flush=True)
finally:
    path.unlink()
