"""Named declaration provenance never opts expanded fields into foreign linking."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--case-prefix', default='')
parser.add_argument('--out', default='/private/tmp/almadar-seed-projection-provenance')
args = parser.parse_args()
orb = os.environ.get('ORB_BIN', str(Path.home() / 'bin/orb'))
source = Path(__file__).resolve().parents[3] / 'dev/atoms/std-mock-seed.lolo'
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
manifest = {'binarySha256': hashlib.sha256(Path(orb).read_bytes()).hexdigest(),
            'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'results': []}


def play(label, steps):
    result = subprocess.run([orb, 'execute', str(source), '--steps', json.dumps(steps)],
                            text=True, capture_output=True)
    (out / (label + '.json')).write_text(result.stdout)
    (out / (label + '.stderr')).write_text(result.stderr)
    assert result.returncode == 0, result.stdout + result.stderr
    report = json.loads(result.stdout)
    assert report.get('success') is True, report
    return [event for step in report['steps'] for outcome in step['outcomes']
            for event in outcome.get('emits', [])]


def walk(label, spec, seeded):
    return play(label, [
        {'trait': 'MockSeed', 'event': 'CORPUS_IS', 'payload': {'words': ['oak', 'pine', 'elm']}},
        {'trait': 'MockSeed', 'event': 'SEED_STREAM', 'payload': {'seed': 42, 'nowMs': '1970-01-01T00:00:00.000Z'}},
        {'trait': 'MockSeed', 'event': 'WALK_START', 'payload': {
            'spec': spec, 'name': 'alias', 'entityName': 'Note', 'index': 1,
            'seeded': seeded, 'runtime': False, 'nowMs': '1970-01-01T00:00:00.000Z'}},
    ])


cases = []
for seeded in (False, True):
    for shape, spec in [
        ('scalar', {'type': 'string'}),
        ('object', {'type': 'object', 'properties': {'flag': {'type': 'boolean'}}}),
        ('array', {'type': 'array', 'items': {'type': 'number'}}),
        ('array-item', {'type': 'array', 'items': {'type': 'number'}}),
    ]:
        cases.append((f'walk-{shape}-{seeded}', spec, shape == 'array-item', seeded))
failures = []
for label, plain, at_item, seeded in cases:
    if not label.startswith(args.case_prefix):
        continue
    named = copy.deepcopy(plain)
    field = copy.deepcopy(plain)
    (named['items'] if at_item else named)['projectedFrom'] = {'type': 'Shared'}
    (field['items'] if at_item else field)['projectedFrom'] = {'type': 'Shared', 'field': 'id'}
    baseline = walk(label + '-plain', plain, seeded)
    named_result = walk(label + '-named', named, seeded)
    field_result = walk(label + '-field', field, seeded)
    named_ok = named_result == baseline
    field_values = [event['payload']['value'] for event in field_result if event['event'] == 'WALKED']
    field_ok = field_values == [([] if plain['type'] == 'array' else '')]
    passed = named_ok and field_ok
    manifest['results'].append({'case': label, 'passed': passed,
                                'namedMatchesExpanded': named_ok, 'foreignPlaceholder': field_ok})
    print(label, 'PASS' if passed else f'FAIL named={named_ok} foreign={field_ok}', flush=True)
    if not passed:
        failures.append(label)

for label, event, extra in [('row-optional-even', 'WALK_ROW', {'index': 2}),
                            ('row-optional-odd', 'WALK_ROW', {'index': 1}),
                            ('row-required-even', 'WALK_ROW', {'index': 2, 'required': True})]:
    if not label.startswith(args.case_prefix):
        continue
    base_field = {'name': 'alias', 'type': 'string', 'required': extra.get('required', False)}
    variants = {}
    for kind in ('plain', 'named', 'field'):
        field = dict(base_field)
        if kind != 'plain':
            field['projectedFrom'] = {'type': 'Shared'}
            if kind == 'field':
                field['projectedFrom']['field'] = 'id'
        result = play(label + '-' + kind, [
            {'trait': 'MockSeed', 'event': 'CORPUS_IS', 'payload': {'words': ['oak', 'pine', 'elm']}},
            {'trait': 'MockSeed', 'event': 'SEED_STREAM', 'payload': {'seed': 42, 'nowMs': '1970-01-01T00:00:00.000Z'}},
            {'trait': 'MockSeed', 'event': event, 'payload': {'fields': [field],
                'index': extra['index'], 'seeded': True, 'runtime': False,
                'identity': False, 'entityName': 'Note', 'nowMs': '1970-01-01T00:00:00.000Z'}},
        ])
        variants[kind] = [e['payload']['row'] for e in result if e['event'] == 'ROW_WALKED']
    passed = variants['plain'] == variants['named'] and variants['field'] == [{'alias': ''}]
    manifest['results'].append({'case': label, 'passed': passed})
    print(label, 'PASS' if passed else 'FAIL', flush=True)
    if not passed:
        failures.append(label)

for at_item in (False, True):
    label = 'dataset-array-item' if at_item else 'dataset-scalar'
    if not label.startswith(args.case_prefix):
        continue
    variants = {}
    for kind in ('plain', 'named', 'field'):
        field = {'name': 'alias', 'type': 'array', 'items': {'type': 'string'}} if at_item else {'name': 'alias', 'type': 'string'}
        if kind != 'plain':
            (field['items'] if at_item else field)['projectedFrom'] = {'type': 'Shared'}
            if kind == 'field':
                (field['items'] if at_item else field)['projectedFrom']['field'] = 'id'
        program = {'orbitals': [
            {'entity': {'name': 'Shared', 'collection': 'sources', 'persistence': 'persistent',
                        'fields': [{'name': 'id', 'type': 'string'}], 'instances': [{'id': 'source-id'}]}},
            {'entity': {'name': 'Note', 'collection': 'notes', 'persistence': 'persistent',
                        'fields': [field]}},
        ]}
        events = play(label + '-' + kind, [{'trait': 'MockSeed', 'event': 'DATASET_INPUT',
            'payload': {'program': program, 'count': 2, 'seed': 42, 'nowMs': '1970-01-01T00:00:00.000Z',
                        'viewerId': '', 'ownerPairs': []}}])
        variants[kind] = [e['payload'] for e in events if e['event'] == 'DATASET_DONE']
    expected = ['source-id'] if at_item else 'source-id'
    passed = (len(variants['plain']) == 1 and variants['plain'] == variants['named']
              and len(variants['field']) == 1
              and all(row['alias'] == expected for row in variants['field'][0]['stores']['notes']))
    manifest['results'].append({'case': label, 'passed': passed})
    print(label, 'PASS' if passed else 'FAIL', flush=True)
    if not passed:
        failures.append(label)

(out / 'results.json').write_text(json.dumps(manifest, indent=2))
assert manifest['results'], 'No matching controls'
assert not failures, failures
