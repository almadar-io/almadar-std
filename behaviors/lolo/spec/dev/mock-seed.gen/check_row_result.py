"""A declared row root is constructed as a map; field roots stay generic."""
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
expression = sampler.build_expr('?cells', row_root=True)
source = '''app seed-row-result [version: "1.0.0"]
type MockValue = string | number | boolean | [MockValue?] | Map string MockValue?
type SampleValueMap = Map string MockValue?
type ProbeCell = { path : string!, kind : string!, text : string, num : number, url : string, mime : string, kids : [string], keys : [string], val : MockValue? }
orbital RowResultProbe {
  entity Probe [runtime] { id : string! }
  trait RowBuilder -> Probe {
    initial: ready
    state ready {
      ASSEMBLE -> ready
        (let ((built EXPR)) (emit ROW_DONE { row: (default (object/set @built "id" "row") @built) }))
    }
    listens { ASSEMBLE -> input { cells : [ProbeCell]! } }
    emits { ROW_DONE -> external { row : Map string MockValue? } }
  }
  page boot as RowResultProbeStart -> RowBuilder
}
'''.replace('EXPR', expression)
with tempfile.NamedTemporaryFile(mode='w', suffix='.lolo', prefix='.seed-row-result-',
                                  dir=spec_dir, delete=False) as output:
    output.write(source)
    path = Path(output.name)
try:
    checked = subprocess.run([orb, 'validate', str(path), '--deny-warnings', '--json'],
                             capture_output=True, text=True)
    report = json.loads(checked.stdout)
    assert report.get('valid') is True, report
    print('pass: genuine row-root constructor validates as a map', flush=True)
    for cells, expected in [
        ([{'path': '', 'kind': 'row', 'keys': [], 'kids': []}], {'id': 'row'}),
        ([{'path': '', 'kind': 'row', 'keys': ['title'], 'kids': ['title']},
          {'path': 'title', 'kind': 'string', 'text': '007'}], {'title': '007', 'id': 'row'}),
        ([{'path': '', 'kind': 'row', 'keys': ['skip', 'nested'], 'kids': ['skip', 'nested']},
          {'path': 'skip', 'kind': 'omit'},
          {'path': 'nested', 'kind': 'object', 'keys': ['ok'], 'kids': ['nested.ok']},
          {'path': 'nested.ok', 'kind': 'boolean', 'text': 'true'}],
         {'nested': {'ok': True}, 'id': 'row'}),
    ]:
        played = subprocess.run([orb, 'execute', str(path), '--steps', json.dumps([
            {'trait': 'RowBuilder', 'event': 'ASSEMBLE', 'payload': {'cells': cells}}])],
            capture_output=True, text=True)
        result = json.loads(played.stdout)
        actual = [e['payload']['row'] for step in result.get('steps', [])
                  for outcome in step['outcomes'] for e in outcome['emits']
                  if e['event'] == 'ROW_DONE']
        assert actual == [expected], {'actual': actual, 'expected': expected, 'stderr': played.stderr}
        print('pass: assembled row=' + json.dumps(expected), flush=True)
    atom = spec_dir.parent.parent / 'dev' / 'atoms' / 'std-mock-seed.lolo'
    steps = [
        {'trait': 'MockSeed', 'event': 'WALK_START', 'payload': {
            'spec': {'type': 'string', 'default': '007'}, 'name': 'title', 'entityName': 'Note',
            'index': 1, 'seeded': False, 'runtime': False, 'nowMs': '1970-01-01T00:00:00.000Z'}},
        {'trait': 'MockSeed', 'event': 'SAMPLE_ROWS', 'payload': {
            'fields': [{'name': 'title', 'type': 'string', 'mock': 'A,B'},
                       {'name': 'nested', 'type': 'object',
                        'properties': {'flag': {'type': 'boolean', 'mock': 'true,false'}}}],
            'name': 'Note', 'count': 2, 'runtime': False, 'identity': False}},
    ]
    played = subprocess.run([orb, 'execute', str(atom), '--steps', json.dumps(steps)],
                            capture_output=True, text=True)
    result = json.loads(played.stdout)
    assert result.get('success') is True, result
    events = lambda step: [event for outcome in step['outcomes'] for event in outcome['emits']]
    field_events = events(result['steps'][0])
    assert [e['payload']['value'] for e in field_events if e['event'] == 'WALKED'] == ['007'], field_events
    assert not any(e['event'] == 'ROW_WALKED' for e in field_events), field_events
    row_events = events(result['steps'][1])
    order = [e['event'] for e in row_events if e['event'] in ['WALKED', 'ROW_WALKED', 'ROWS_DONE']]
    assert order == ['WALKED', 'ROW_WALKED', 'WALKED', 'ROW_WALKED', 'ROWS_DONE'], order
    rows = [e['payload']['rows'] for e in row_events if e['event'] == 'ROWS_DONE']
    assert rows == [[{'title': 'A', 'nested': {'flag': True}, 'id': 'Note-1'},
                     {'title': 'B', 'nested': {'flag': False}, 'id': 'Note-2'}]], rows
    print('pass: generic field WALKED and typed row callback preserve payloads, order and final rows', flush=True)
finally:
    path.unlink()
