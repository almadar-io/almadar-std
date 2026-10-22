"""Replay journal provenance without duplicating the existing seed/access datasets."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
access = json.loads((spec_dir / 'mock-seed-access.replay.goldens.json').read_text())
inputs = json.loads((spec_dir / 'mock-seed-input.replay.goldens.json').read_text())
cases = []

def selected(text):
    return copy.deepcopy(next(case for case in access['cases'] if text in case['id']))

def cell(store, row_id, column):
    return {'store': store, 'id': row_id, 'column': column}

def journal(case, stamped, deferred):
    viewer = next(step['payload']['viewerId'] for step in case['steps'] if step['event'] in ['DATASET_START', 'DATASET_INPUT'])
    done = next(emit for emit in case['steps'][-1]['expect']['emits'] if emit['event'] == 'DATASET_DONE')
    done['payload']['journal'] = {'viewerId': viewer, 'stamped': stamped, 'deferred': deferred}
    case['id'] = 'journal: ' + case['id']
    return case

success = journal(selected('dataset-env-owner-columns'), [cell('task', 'Task Id 1', 'ownerRef'), cell('task', 'Task Id 3', 'ownerRef')], [])
cases.append(success)
cases.append(journal(selected('dataset-control-no-identity-may-create'), [], [cell('tickets', 'Ticket Id 1', 'assignee'), cell('tickets', 'Ticket Id 3', 'assignee')]))
cases.append(journal(selected('dataset-self-identity-stamps'), [cell('employeeself', 'v1', 'id')], []))
cases.append(journal(copy.deepcopy(access['cases'][0]), [cell('tickets', 'Ticket Id ' + str(i), 'assignee') for i in [1, 3, 5]], []))
cases.append(journal(selected('dataset-control-no-viewer-stamps'), [], []))
authored = selected('dataset-env-owner-columns')
authored['id'] = 'authored-owner-values-are-not-in-journal'
authored['steps'][-1]['payload']['result']['orbitals'][0]['entity']['instances'] = [{'id': 'authored', 'ownerRef': 'writer'}]
authored['steps'][-1]['expect']['emits'][0]['payload']['stores'] = {'task': [{'id': 'authored', 'ownerRef': 'writer', 'createdAt': '2026-06-01T00:00:00.000Z', 'updatedAt': '2026-06-01T00:00:00.000Z'}]}
cases.append(journal(authored, [], []))
for name in ['locale-localized', 'locale-empty-overrides-default']:
    cases.append(journal(copy.deepcopy(next(case for case in inputs['cases'] if case['id'] == name)), [], []))
# The same access vectors exercise the resolved-input path, retaining every expected store row.
for case in copy.deepcopy(cases[:6]):
    start = next(step for step in case['steps'] if step['event'] == 'DATASET_START')
    env = next(step for step in case['steps'] if step['event'] == 'DS_OWNS_ENV')
    read = case['steps'][-1]
    pairs = []
    for part in env['payload'].get('value', '').split(','):
        pair = part.strip().split('.', 1)
        if len(pair) == 2 and all(pair):
            pairs.append({'entity': pair[0], 'column': pair[1]})
    payload = {key: value for key, value in start['payload'].items() if key != 'source'}
    payload.update(program=read['payload']['result'], ownerPairs=pairs)
    case['id'] += ' via resolved input'
    case['steps'] = [step for step in case['steps'] if step['event'] == 'INIT'] + [{'event': 'DATASET_INPUT', 'payload': payload, 'expect': read['expect']}]
    cases.append(case)
resolved_success = copy.deepcopy(cases[8])
reset_input = copy.deepcopy(cases[6]['steps'][-1])
cases.append({'id': 'journal: repeated-input-resets-prior-stamps', 'steps': resolved_success['steps'] + [reset_input]})
default_input = copy.deepcopy(next(case for case in inputs['cases'] if case['id'] == 'locale-omitted')['steps'][-1])
expected = default_input['expect']
expected['emits'][0]['payload']['journal'] = {'viewerId': '', 'stamped': [], 'deferred': []}
payload = {key: value for key, value in default_input['payload'].items() if key not in ['program', 'ownerPairs']}
payload['source'] = 'program.lolo'
cases.append({'id': 'journal: source-start-resets-prior-stamps', 'steps': copy.deepcopy(success['steps']) + [
    {'event': 'DATASET_START', 'payload': payload}, {'event': 'DS_OWNS_ENV', 'payload': {}},
    {'event': 'DS_PROGRAM_READ', 'payload': {'result': default_input['payload']['program']}, 'expect': expected},
]})
denied_input = copy.deepcopy(next(case for case in cases if 'dataset-control-no-identity-may-create' in case['id'] and case['id'].endswith('via resolved input')))
cases.append({'id': 'journal: repeated-input-resets-prior-deferred-cells', 'steps': denied_input['steps'] + [copy.deepcopy(reset_input)]})
rekey = copy.deepcopy(success)
rekey['id'] = 'journal: every tracked cell follows-final-self-id'
next(step for step in rekey['steps'] if step['event'] == 'DS_OWNS_ENV')['payload']['value'] = 'Task.id,Task.ownerRef'
rekey['steps'][-1]['expect']['emits'][0]['payload']['stores']['task'][0]['id'] = 'v1'
rekey['steps'][-1]['expect']['emits'][0]['payload']['journal']['stamped'] = [cell('task', 'v1', 'id'), cell('task', 'v1', 'ownerRef'), cell('task', 'Task Id 3', 'ownerRef')]
cases.append(rekey)
localized = copy.deepcopy(next(case for case in cases if 'authored-owner-values-are-not-in-journal' in case['id'] and case['id'].endswith('via resolved input')))
localized['id'] = 'journal: localized-authored-owner-values-remain-untracked'
step = localized['steps'][-1]
step['payload']['locale'] = 'ar'
step['payload']['program']['orbitals'][0]['entity']['localeInstances'] = {'ar': [{'id': 'arabic', 'ownerRef': 'كاتب'}]}
step['expect']['emits'][0]['payload']['stores']['task'][0].update(id='arabic', ownerRef='كاتب')
cases.append(localized)
selection = os.environ.get('JOURNAL_CASE_INDEX')
if selection is not None:
    cases = [cases[int(selection)]]
with tempfile.NamedTemporaryFile(mode='w', suffix='.replay.goldens.json', prefix='mock-seed-journal-', dir=spec_dir, delete=False) as output:
    json.dump({'atom': access['atom'], 'trait': access['trait'], 'cases': cases}, output, ensure_ascii=False)
    path = Path(output.name)
command = [os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb')), 'goldens', os.path.relpath(path)]
evidence = Path(tempfile.gettempdir()) / ('almadar-seed-journal-' + Path(command[0]).parent.name + '-' + (selection or 'all'))
evidence.with_suffix('.input.json').write_text(path.read_text())
evidence.with_suffix('.command.json').write_text(json.dumps(command))
try:
    with evidence.with_suffix('.log').open('w') as log:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            print(line, end='', flush=True)
            log.write(line)
            log.flush()
        raise SystemExit(process.wait())
finally:
    path.unlink()
