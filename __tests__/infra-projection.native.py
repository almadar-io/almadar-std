import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--orb', default=os.environ.get('ORB', str(Path.home() / 'bin/orb')))
parser.add_argument('--case-prefix', default='')
parser.add_argument('--out', default='/private/tmp/almadar-infra-projection-native')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = root / 'behaviors/lolo/ops/atoms/std-infra-projection.lolo'
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
version = subprocess.check_output([args.orb, '--version'], text=True).strip()
print(version, hashlib.sha256(Path(args.orb).read_bytes()).hexdigest(), flush=True)
program = {'orbitals': [{'name': 'Notes', 'entity': {'name': 'Note', 'persistence': 'persistent', 'fields': []}, 'traits': [], 'pages': [], 'services': []}]}
heavy = {'orbitals': [dict(program['orbitals'][0], name=f'Notes{i}', traits=[{'name': 'Writer', 'stateMachine': {'transitions': [{'effects': [['persist', 'create', 'Note', {}]] * 4}]}}]) for i in range(6)]}
cases = [('tier1-postgres', 1, 'postgres', program, True), ('tier1-default', 1, '', program, False), ('tier2-postgres', 2, 'postgres', program, True), ('tier2-firestore', 2, 'firestore', program, False), ('tier3-firestore', 3, 'firestore', program, False), ('tier3-default', 3, '', program, True), ('tier2-heavy-default', 2, '', heavy, True), ('tier2-heavy-firestore', 2, 'firestore', heavy, False), ('tier1-heavy-default', 1, '', heavy, False)]
cases.extend((f'dbfree-tier{tier}-{database or "default"}', tier, database, {'orbitals': []}, database == 'postgres' or (not database and tier == 3)) for tier in (1, 2, 3) for database in ('', 'postgres', 'firestore'))
cases = [case for case in cases if case[0].startswith(args.case_prefix)]
assert cases, 'No matching controls'
failures = []
for name, tier, database, fixture, postgres in cases:
    payload = {'program': json.dumps(fixture), 'appName': 'probe', 'tier': tier, 'database': database}
    steps = [{'trait': 'InfraProjector', 'event': 'INFRA_PROJECT', 'payload': payload}]
    run = subprocess.run([args.orb, 'execute', str(source), '--steps', json.dumps(steps), '--json'], text=True, capture_output=True)
    (out / f'{name}.json').write_text(run.stdout)
    (out / f'{name}.stderr').write_text(run.stderr)
    assert run.returncode == 0, run.stderr
    result = json.loads(run.stdout)
    emits = [e for step in result['steps'] for outcome in step['outcomes'] for e in outcome.get('emits', []) if e['event'] == 'INFRA_PROJECTED']
    assert result['success'] and len(emits) == 1, result
    projected = emits[0]['payload']
    hcl = projected['hcl']
    (out / f'{name}.tf').write_text(hcl)
    (out / f'{name}.variables.tf').write_text(projected['variables'])
    declarations = re.findall(r'resource "([^"]+)" "([^"]+)"', hcl)
    declared = {f'{kind}.{instance}' for kind, instance in declarations}
    references = set(re.findall(r'\b(google_[a-z0-9_]+\.[a-zA-Z0-9_-]+)\.', hcl))
    cost = [c['resource'] for c in projected['cost']]
    variables = set(re.findall(r'variable "([^"]+)"', projected['variables']))
    variable_references = set(re.findall(r'\bvar\.([a-zA-Z0-9_]+)', hcl))
    firestore = bool(fixture['orbitals']) and not postgres
    checks = {
        'tier unchanged': projected['tier'] == tier,
        'persistent entity counted': projected['analysis']['persistentEntityCount'] == len(fixture['orbitals']),
        'SQL inventory': ('google_sql_database_instance' in projected['resources']) == postgres,
        'SQL database inventory': ('google_sql_database' in projected['resources']) == postgres,
        'SQL definition': ('google_sql_database_instance.main' in declared) == postgres,
        'SQL database definition': ('google_sql_database.app' in declared) == postgres,
        'SQL IAM': ('google_project_iam_member.sa_cloudsql' in declared) == postgres,
        'database URL': ('name  = "DATABASE_URL"' in hcl) == postgres,
        'VPC inventory': ('google_vpc_access_connector' in projected['resources']) == postgres,
        'VPC definition': ('google_vpc_access_connector.main' in declared) == postgres,
        'SQL socket instance': ('instances = [google_sql_database_instance.main.connection_name]' in hcl) == postgres,
        'SQL volume': ('mount_path = "/cloudsql"' in hcl) == postgres,
        'Firestore inventory': ('google_firestore_database' in projected['resources']) == firestore,
        'Firestore definition': ('google_firestore_database.main' in declared) == firestore,
        'Firestore environment': ('name  = "FIREBASE_DATABASE_ID"' in hcl) == firestore,
        'SQL cost': ('Cloud SQL Postgres' in cost) == postgres,
        'Firestore cost': ('Firestore' in cost) == firestore,
        'no duplicate definitions': len(declarations) == len(declared),
        'no dangling resource references': references <= declared,
        'no dangling variable references': variable_references <= variables,
        'cost totals': projected['monthlyMin'] == sum(c['min'] for c in projected['cost']) and projected['monthlyMax'] == sum(c['max'] for c in projected['cost']),
    }
    failed = [key for key, passed in checks.items() if not passed]
    print(name, 'PASS' if not failed else 'FAIL: ' + ', '.join(failed), flush=True)
    failures.extend((name, key) for key in failed)
(out / 'results.json').write_text(json.dumps({'version': version, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'controls': len(cases), 'failures': failures}, indent=2))
assert not failures, failures
