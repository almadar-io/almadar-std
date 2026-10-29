import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORB = process.env.ORB_BIN ?? 'orb';
const HERE = dirname(fileURLToPath(import.meta.url));

function evaluate(expr: string) {
  const run = spawnSync(ORB, ['evaluate', expr], { cwd: HERE, encoding: 'utf8' });
  return { status: run.status, out: run.stdout.trim(), err: run.stderr };
}

describe('orb evaluate plays the std eval atom on the real kernel', () => {
  const cases: Array<[string, string]> = [
    ['["+", 1, 2]', '3'],
    ['["=", 1, 1]', 'true'],
    ['["str/upper", "a"]', 'A'],
    ['["array/range", 3]', '[0,1,2]'],
    ['["object/get", {"a": 2}, "a"]', '2'],
  ];
  for (const [expr, value] of cases) {
    it(`${expr} answers ${value}`, () => {
      const result = evaluate(expr);
      expect(result.err).not.toContain('ORB_SCHEMA_RETIRED_TRAIT_KEY');
      expect(result.status).toBe(0);
      expect(result.out).toBe(value);
    });
  }

  it('control: an expression the evaluator refuses answers its error and a failing exit', () => {
    const result = evaluate('["+", 1, "a"]');
    expect(result.status).not.toBe(0);
  });
});
