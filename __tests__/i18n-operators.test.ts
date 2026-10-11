/**
 * The operator half of the language i18n gate. `@almadar/core` owns English
 * and the gate; the language packs (devDependencies here) own their spellings;
 * this package owns `canonical-operators.json`, so the full check — every
 * pack's operator set equals the canonical one — runs here.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkI18nCoverage,
  getVocabulary,
  installedLanguages,
  lexLolo,
  registerVocabulary,
  vocabularyOperators,
  type I18nTables,
  type LanguageCode,
  type OperatorTables,
} from '@almadar/core/i18n';
import { readVocabularyPacks } from '@almadar/core/language-data';

const PKG_ROOT = join(import.meta.dirname, '..');

function canonicalOperatorNames(): string[] {
  const canonical = JSON.parse(readFileSync(join(PKG_ROOT, 'canonical-operators.json'), 'utf8')) as {
    operators: Record<string, object>;
  };
  return Object.keys(canonical.operators);
}

describe('i18n operator tables', () => {
  it('English + every first-party pack pass the coverage gate against canonical-operators.json', () => {
    for (const pack of readVocabularyPacks(PKG_ROOT, join(PKG_ROOT, '.no-user-store'))) registerVocabulary(pack.vocabulary);
    const langs = installedLanguages();
    expect(langs).toEqual(expect.arrayContaining(['en', 'ar', 'sl']));
    const names = canonicalOperatorNames();
    const core: Record<LanguageCode, I18nTables> = {};
    const std: Record<LanguageCode, OperatorTables> = {};
    for (const lang of langs) {
      core[lang] = getVocabulary(lang);
      std[lang] = vocabularyOperators(lang) ?? { operators: Object.fromEntries(names.map((n) => [n, n])) };
    }
    const result = checkI18nCoverage({ core, std, canonicalOperators: names });

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
    const unspellable: string[] = [];
    for (const name of canonicalOperatorNames()) {
      const tokens = lexLolo(name);
      const isOneToken = tokens.length === 1 && tokens[0].start === 0 && tokens[0].end === name.length;
      if (!isOneToken) unspellable.push(name);
    }
    expect(unspellable, `registered but unspellable as one token: ${unspellable.join(', ')}`).toEqual([]);
  });
});
