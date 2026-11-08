// G-ORB-049: a call-site `fields`/`columns` entry that names no field of the bound entity is refused,
// because BrowseFieldSpec.name and ColumnSpec.field are typed `field @entity`.
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORB = process.env.ORB_BIN ?? 'orb-dev';

function validate(name: string): { status: number | null; out: string } {
  const run = spawnSync(ORB, ['validate', resolve(HERE, 'fixtures', name)], { cwd: HERE, encoding: 'utf8' });
  return { status: run.status, out: `${run.stdout}${run.stderr}` };
}

describe('std-browse names real entity fields', () => {
  it('refuses a fields name and a columns field the entity does not declare', () => {
    const { status, out } = validate('browse-field-ref-bad.lolo');
    expect(status).not.toBe(0);
    expect(out).toContain('ORB_CONFIG_FIELD_REF_UNKNOWN');
    expect(out).toContain('`fields` names `title`');
    expect(out).toContain('`columns` names `nope`');
  });

  it('control: real fields validate clean', () => {
    const { status, out } = validate('browse-field-ref-good.lolo');
    expect(out).not.toContain('ORB_CONFIG_FIELD_REF_UNKNOWN');
    expect(status).toBe(0);
  });
});
