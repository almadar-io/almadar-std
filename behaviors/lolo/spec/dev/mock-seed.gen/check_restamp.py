"""Check native restamp changes, provenance and current-row preservation."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile

spec_dir = Path(__file__).resolve().parent.parent
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin' / 'orb'))
source = spec_dir / 'mock-seed-access.fixture.lolo'
program = {'orbitals': [
    {'entity': {'name': 'Person', 'identity': True, 'collection': 'people', 'fields': [{'name': 'id', 'type': 'string', 'required': True}, {'name': 'role', 'type': 'string'}]}},
    {'entity': {'name': 'Task', 'collection': 'tasks', 'fields': [{'name': 'id', 'type': 'string', 'required': True}, {'name': 'ownerRef', 'type': 'string'}, {'name': 'otherOwner', 'type': 'string'}]}},
    {'entity': {'name': 'Ticket', 'collection': 'tickets', 'create_policy': ['=', '@user.role', 'agent'], 'fields': [{'name': 'id', 'type': 'string', 'required': True}, {'name': 'assignee', 'type': 'relation', 'relation': {'entity': 'Person', 'cardinality': 'one'}}]}},
    {'entity': {'name': 'Doc', 'collection': 'docs', 'read_policy': ['=', '@user.id', '@entity.authorId'], 'fields': [{'name': 'id', 'type': 'string', 'required': True}, {'name': 'authorId', 'type': 'relation', 'relation': {'entity': 'Person', 'cardinality': 'one'}}]}},
]}

def cell(store, row_id, column):
    return {'store': store, 'id': row_id, 'column': column}

def change(store, row_id, column, owner, kind='set', runtime=False):
    target = {'kind': 'singleton'} if runtime else {'kind': 'key', 'key': row_id}
    return {'kind': kind, 'store': store, 'id': row_id, 'column': column, 'ownerId': owner, 'target': target}

people = [{'id': 'agent', 'role': 'agent'}, {'id': 'reader', 'role': 'reader'}]
base = {'people': people, 'tasks': [{'id': 't1', 'ownerRef': 'manual edit', 'title': 'edited title'}, {'id': 'user-row', 'ownerRef': 'user', 'title': 'created by user'}]}
journal = {'viewerId': 'old', 'stamped': [cell('tasks', 't1', 'ownerRef')], 'deferred': []}
cases = []

def case(label, stores, previous, viewer, changes, after, stamped=None, deferred=None, program=program):
    expected_journal = copy.deepcopy(previous)
    expected_journal['viewerId'] = '' if viewer is None else viewer['id']
    if stamped is not None:
        expected_journal['stamped'] = stamped
    if deferred is not None:
        expected_journal['deferred'] = deferred
    cases.append({'id': label, 'payload': {'program': program, 'stores': stores, 'journal': previous, 'viewer': viewer},
                  'changes': changes, 'stores': after, 'journal': expected_journal})

new = {'id': 'new', 'role': 'reader', 'name': 'New viewer'}
after = copy.deepcopy(base); after['tasks'][0]['ownerRef'] = 'new'
case('tracked-owner-edit-restamped-other-fields-and-user-rows-preserved', base, journal, new, [change('tasks', 't1', 'ownerRef', 'new')], after)
case('same-viewer-id-does-not-write-even-when-role-changes', base, journal, {'id': 'old', 'role': 'agent'}, [], base)
case('anonymous-remembers-empty-viewer-without-clearing-owners', base, journal, None, [], base)
missing = copy.deepcopy(journal); missing['stamped'].append(cell('tasks', 'deleted', 'ownerRef')); missing['deferred'] = [cell('tickets', 'deleted', 'assignee')]
case('missing-stamped-retained-and-missing-deferred-dropped', base, missing, new, [change('tasks', 't1', 'ownerRef', 'new')], after, deferred=[])
tickets = {'people': people, 'tickets': [{'id': 'q1', 'assignee': 'old', 'title': 'keep'}]}
ticket_journal = {'viewerId': 'old', 'stamped': [cell('tickets', 'q1', 'assignee')], 'deferred': []}
fallback = copy.deepcopy(tickets); fallback['tickets'][0]['assignee'] = 'agent'
case('stamped-denied-viewer-gets-first-eligible-fallback', tickets, ticket_journal, {'id': 'reader', 'role': 'reader'}, [change('tickets', 'q1', 'assignee', 'agent')], fallback)
none = copy.deepcopy(tickets); none['people'] = [{'id': 'reader', 'role': 'reader'}]
case('stamped-denied-with-no-eligible-owner-keeps-current-value', none, ticket_journal, {'id': 'reader', 'role': 'reader'}, [], none)
deferred = {'viewerId': 'old', 'stamped': [], 'deferred': [cell('tickets', 'q1', 'assignee')]}
case('deferred-is-not-promoted-by-fallback', tickets, deferred, {'id': 'reader', 'role': 'reader'}, [], tickets)
external = {'id': 'external-agent', 'role': 'agent', 'customClaim': 'kept'}
promoted = copy.deepcopy(tickets); promoted['tickets'][0]['assignee'] = external['id']
case('deferred-promoted-by-full-viewer-outside-roster', tickets, deferred, external, [change('tickets', 'q1', 'assignee', external['id'])], promoted, stamped=deferred['deferred'], deferred=[])
id_denied = {'viewerId': 'old', 'stamped': [cell('tickets', 'q1', 'id')], 'deferred': []}
case('self-id-create-denial-has-no-fallback', tickets, id_denied, {'id': 'reader', 'role': 'reader'}, [], tickets)
docs = {'people': people, 'docs': [{'id': 'd1', 'authorId': 'agent', 'title': 'keep doc'}]}
doc_journal = {'viewerId': 'agent', 'stamped': [cell('docs', 'd1', 'authorId')], 'deferred': []}
doc_after = copy.deepcopy(docs); doc_after['docs'][0]['authorId'] = 'reader'
case('ownership-scoped-read-admits-new-owner', docs, doc_journal, {'id': 'reader', 'role': 'reader'}, [change('docs', 'd1', 'authorId', 'reader')], doc_after)
runtime_program = copy.deepcopy(program)
runtime_program['orbitals'][1]['entity']['persistence'] = 'runtime'
runtime_rows = {'people': people, 'tasks': [{'id': 'old-row', 'ownerRef': 'old', 'title': 'keep title'}]}
runtime_journal = {'viewerId': 'old', 'stamped': [cell('tasks', 'old-row', 'id'), cell('tasks', 'old-row', 'ownerRef')], 'deferred': []}
runtime_after = copy.deepcopy(runtime_rows); runtime_after['tasks'][0].update(id='new', ownerRef='new')
case('runtime-store-changes-address-the-singleton-and-rekey-keeps-it', runtime_rows, runtime_journal, new,
     [change('tasks', 'old-row', 'id', 'new', 'rekey', True), change('tasks', 'new', 'ownerRef', 'new', runtime=True)], runtime_after,
     stamped=[cell('tasks', 'new', 'id'), cell('tasks', 'new', 'ownerRef')], program=runtime_program)
rekey_rows = {'tasks': [{'id': 'old-row', 'ownerRef': 'old', 'otherOwner': 'old', 'title': 'keep title'}, {'id': 'other', 'title': 'keep other'}]}
rekey_journal = {'viewerId': 'old', 'stamped': [cell('tasks', 'old-row', 'id'), cell('tasks', 'old-row', 'ownerRef')], 'deferred': [cell('tasks', 'old-row', 'otherOwner')]}
rekey_after = copy.deepcopy(rekey_rows); rekey_after['tasks'][0].update(id='new', ownerRef='new', otherOwner='new')
case('rekey-updates-both-journals-and-later-pending-cells', rekey_rows, rekey_journal, new,
     [change('tasks', 'old-row', 'id', 'new', 'rekey'), change('tasks', 'new', 'ownerRef', 'new'), change('tasks', 'new', 'otherOwner', 'new')], rekey_after,
     stamped=[cell('tasks', 'new', 'id'), cell('tasks', 'new', 'ownerRef'), cell('tasks', 'new', 'otherOwner')], deferred=[])
for label, rows, winner in [
    ('collision-old-before-destination-last-map-value-wins', [{'id': 'old-row', 'title': 'old'}, {'id': 'middle', 'title': 'middle'}, {'id': 'new', 'title': 'destination'}], 'destination'),
    ('collision-destination-before-old-last-map-value-wins', [{'id': 'new', 'title': 'destination'}, {'id': 'middle', 'title': 'middle'}, {'id': 'old-row', 'title': 'old'}], 'old'),
]:
    old = {'viewerId': 'old', 'stamped': [cell('tasks', 'old-row', 'id')], 'deferred': []}
    case(label, {'tasks': rows}, old, new, [change('tasks', 'old-row', 'id', 'new', 'rekey')], {'tasks': [{'id': 'new', 'title': winner}, {'id': 'middle', 'title': 'middle'}]}, stamped=[cell('tasks', 'new', 'id')])
with tempfile.NamedTemporaryFile(mode='w', suffix='.orb', prefix='seed-restamp-', delete=False) as output:
    path = Path(output.name)
try:
    emitted = subprocess.run([orb, 'emit', 'orb', os.path.relpath(source), '--output', str(path)], capture_output=True, text=True)
    assert emitted.returncode == 0, emitted.stdout + emitted.stderr
    for entry in cases:
        step = {'trait': 'MockSeed', 'from': 'ready', 'event': 'RESTAMP_INPUT', 'entity': {'id': 'host'}, 'payload': dict(entry['payload'], firstOwner=True)}
        repeated = {'trait': 'MockSeed', 'from': 'ready', 'event': 'RESTAMP_INPUT', 'payload': dict(entry['payload'], stores=entry['stores'], journal=entry['journal'], firstOwner=True)}
        played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps([step, repeated])], capture_output=True, text=True)
        assert played.returncode == 0, played.stdout + played.stderr
        report = json.loads(played.stdout)
        assert report.get('success') is True, report
        result = report['steps'][0]
        outputs = [event['payload'] for outcome in result['outcomes'] for event in outcome['emits'] if event['event'] == 'RESTAMP_DONE']
        assert outputs == [{'journal': entry['journal'], 'changes': entry['changes']}], {'case': entry['id'], 'actual': outputs, 'expectedJournal': entry['journal'], 'expectedChanges': entry['changes']}
        assert result['entityAfter']['dsStores'] == entry['stores'], {'case': entry['id'], 'actualStores': result['entityAfter']['dsStores'], 'expectedStores': entry['stores']}
        repeated_result = report['steps'][1]
        repeated_outputs = [event['payload'] for outcome in repeated_result['outcomes'] for event in outcome['emits'] if event['event'] == 'RESTAMP_DONE']
        assert repeated_outputs == [{'journal': entry['journal'], 'changes': []}], {'case': entry['id'], 'repeatedOutputs': repeated_outputs}
        assert repeated_result['entityAfter']['dsStores'] == entry['stores'], {'case': entry['id'], 'repeatedStores': repeated_result['entityAfter']['dsStores']}
        print('pass: ' + entry['id'] + ' + repeat reset', flush=True)
finally:
    path.unlink()
