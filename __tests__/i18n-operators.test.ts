/**
 * The operator half of the language i18n gate. `@almadar/core` owns the core
 * vocabulary sections and the gate itself; this package owns the operator
 * tables (`i18n/<lang>.json`) and `canonical-operators.json`, so the full
 * core + operators check runs here, downstream of both inputs.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_CODES,
  checkI18nCoverage,
  coreTables,
  lexLolo,
  parseOperatorTables,
  type LanguageCode,
  type OperatorTables,
} from '@almadar/core/i18n';

const PKG_ROOT = join(import.meta.dirname, '..');

function loadOperatorTables(): Record<LanguageCode, OperatorTables> {
  const entries = LANGUAGE_CODES.map((lang) => {
    const file = join(PKG_ROOT, 'i18n', `${lang}.json`);
    return [lang, parseOperatorTables(JSON.parse(readFileSync(file, 'utf8')), file)] as const;
  });
  return Object.fromEntries(entries) as Record<LanguageCode, OperatorTables>;
}

describe('i18n operator tables', () => {
  it('core + operator tables pass the coverage gate against canonical-operators.json', () => {
    const canonical = JSON.parse(readFileSync(join(PKG_ROOT, 'canonical-operators.json'), 'utf8')) as {
      operators: Record<string, unknown>;
    };
    const result = checkI18nCoverage({
      core: coreTables,
      std: loadOperatorTables(),
      canonicalOperators: Object.keys(canonical.operators),
    });

    for (const p of result.problems) {
      console.error(`  [${p.lang}] ${p.section}.${p.kind}: ${p.key}${p.detail ? ' — ' + p.detail : ''}`);
    }
    expect(result.ok, `${result.problems.length} i18n coverage problem(s) — see console output above`).toBe(true);
  });

  // Prevention for the `array/empty?` / `object/empty?` class of defect: both
  // were registered operators with i18n translations, yet unspellable in
  // `.lolo` — the lexer's identifier-continue set excludes `?`, so
  // `(array/empty? @x)` actually lexes as the identifier `array/empty`
  // followed by a bare payload sigil, never as one operator token. Nothing
  // caught that a registered name could not be written as itself; this does.
  it('every canonical operator name lexes as exactly one token (so it is actually spellable)', () => {
    const canonical = JSON.parse(readFileSync(join(PKG_ROOT, 'canonical-operators.json'), 'utf8')) as {
      operators: Record<string, unknown>;
    };
    const unspellable: string[] = [];
    for (const name of Object.keys(canonical.operators)) {
      const tokens = lexLolo(name);
      const isOneToken = tokens.length === 1 && tokens[0].start === 0 && tokens[0].end === name.length;
      if (!isOneToken) unspellable.push(name);
    }
    expect(unspellable, `registered but unspellable as one token: ${unspellable.join(', ')}`).toEqual([]);
  });
});
