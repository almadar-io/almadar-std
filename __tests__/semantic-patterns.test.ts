// The semantic validators have one definition: @almadar/core SEMANTIC_STRING_PATTERNS, carried by the operator table.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_STRING_PATTERNS } from '@almadar/core';
import { STD_OPERATORS } from '../registry.js';

const canonical: { operators: Record<string, { pattern?: string }> } = JSON.parse(
  readFileSync(new URL('../canonical-operators.json', import.meta.url), 'utf8'),
);

describe('validate/email|url|phone|uuid patterns', () => {
  for (const kind of ['email', 'url', 'phone', 'uuid'] as const) {
    it(`validate/${kind} carries core's pattern in the module and in canonical-operators.json`, () => {
      expect(STD_OPERATORS[`validate/${kind}`].pattern).toBe(SEMANTIC_STRING_PATTERNS[kind]);
      expect(canonical.operators[`validate/${kind}`].pattern).toBe(SEMANTIC_STRING_PATTERNS[kind]);
    });
  }

  it('control: no other validator declares a pattern', () => {
    const withPattern = Object.entries(canonical.operators)
      .filter(([name, meta]) => name.startsWith('validate/') && meta.pattern !== undefined)
      .map(([name]) => name);
    expect(withPattern.sort()).toEqual(['validate/email', 'validate/phone', 'validate/url', 'validate/uuid']);
  });
});
