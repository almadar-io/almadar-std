/**
 * I18n Module - Message Catalogs
 *
 * `(i18n/t "key" { params })` reads the active locale's message for `key`
 * from the program's catalogs (`locales/<locale>/<behavior>.json`); a `locale`
 * in the params reads that declared locale's catalog instead. Keys are
 * qualified with the behavior's name at lowering, and `orb validate` checks
 * every key against every declared locale's catalog.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { PRIMITIVE_VALUE, STRING, mapOf, nullable, shape } from '../signature.js';

export const I18N_OPERATORS: Record<string, StdOperatorMeta> = {
  'i18n/t': {
    module: 'i18n',
    category: 'std-i18n',
    minArity: 1,
    maxArity: 2,
    description: "The active locale's message for a catalog key, with {{placeholders}} filled from params; a `locale` in params reads that declared locale's catalog instead (it is never a placeholder)",
    hasSideEffects: false,
    failable: { unlessLiteral: [0], unlessTyped: [{ arg: 0, type: 'messagekey' }] },
    returnType: nullable('string'),
    params: [
      { name: 'key', type: 'messagekey', description: 'Catalog key: a string literal, or a value typed MessageKey (a knob whose literals were qualified where they were written)' },
      { name: 'params', type: mapOf(STRING, PRIMITIVE_VALUE), description: 'Values for the message {{placeholders}}, and optionally `locale`: a declared locale whose catalog to read instead of the active one', optional: true },
    ],
    example: '["i18n/t", "posts.count", { "n": 3 }] // => "3 posts"; ["i18n/t", "hero.title", { "locale": "ar" }] // => the Arabic message under any locale',
  },
  'i18n/direction': {
    module: 'i18n',
    category: 'std-i18n',
    minArity: 0,
    maxArity: 1,
    description: "The active locale's reading direction, rtl or ltr, or a named locale's with { locale }; null until the host sets a locale. Render-time, like i18n/t",
    hasSideEffects: false,
    returnType: nullable('string'),
    params: [
      { name: 'options', type: shape({ locale: STRING }), description: 'The locale whose direction to answer instead of the active one', optional: true },
    ],
    example: '["i18n/direction"] // => "rtl" under ar; ["i18n/direction", { "locale": "ar" }] // => "rtl" under any locale',
  },
};

export function getI18nOperators(): string[] {
  return Object.keys(I18N_OPERATORS);
}
