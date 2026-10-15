/**
 * The registry entry carries trait NAMES only (`traits: string[]`): the per-trait surface
 * (`RegistryTraitSurface`, roles, `getTraitSurface`, `getBehaviorsByRole`) is retired, and a
 * consumer that needs a trait's events, knobs or contract asks `orb behaviors describe --json`.
 * Runs against a fixture registry through the package's data-dir override.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'std-query-'));

beforeAll(() => {
  writeFileSync(
    join(dir, 'behaviors-registry.json'),
    JSON.stringify({
      behaviors: {
        'std-fixture-body': { name: 'std-fixture-body', level: 'atom', traits: ['FixtureBody'], composableWith: [] },
        'std-fixture-pair': { name: 'std-fixture-pair', level: 'organism', traits: ['PairA', 'PairB'], composableWith: [] },
        'std-fixture-bare': { name: 'std-fixture-bare', level: 'atom', composableWith: [] },
      },
    }),
  );
  process.env['ALMADAR_STD_DATA_DIR'] = dir;
});

afterAll(() => {
  delete process.env['ALMADAR_STD_DATA_DIR'];
  rmSync(dir, { recursive: true, force: true });
});

describe('registry entry traits', () => {
  it('lists the trait names of each behavior', async () => {
    const { getBehaviorRegistry } = await import('../behaviors/query');
    const registry = await getBehaviorRegistry();
    expect(registry['std-fixture-body']?.traits).toEqual(['FixtureBody']);
    expect(registry['std-fixture-pair']?.traits).toEqual(['PairA', 'PairB']);
  });

  it('control: an entry that lists no traits has none', async () => {
    const { getBehaviorRegistry } = await import('../behaviors/query');
    expect((await getBehaviorRegistry())['std-fixture-bare']?.traits).toBeUndefined();
  });

  it('the per-trait surface helpers are gone', async () => {
    const query = await import('../behaviors/query');
    expect('getTraitSurface' in query).toBe(false);
    expect('getBehaviorsByRole' in query).toBe(false);
  });
});
