import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface StdManifest {
  orb?: { prefix?: string };
  orbLanguage?: { compiler?: string; operators?: string };
}

const root = join(__dirname, '..');
const manifest: StdManifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

describe('@almadar/std package.json operator-table declaration', () => {
  it('declares the operator table under the top-level `orbLanguage` key, apart from the behavior `orb` block', () => {
    expect(manifest.orb?.prefix).toBe('almadar-std');
    expect(manifest.orb).not.toHaveProperty('operators');
    expect(manifest.orbLanguage?.compiler).toMatch(/\d+\.\d+\.\d+/);
    expect(manifest.orbLanguage?.operators).toBe('canonical-operators.json');
  });

  it('points at a shipped file', () => {
    const files: string[] = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).files;
    expect(files).toContain('canonical-operators.json');
    expect(existsSync(join(root, 'canonical-operators.json'))).toBe(true);
  });
});
