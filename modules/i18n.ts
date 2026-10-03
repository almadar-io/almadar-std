/**
 * I18n Module - Message Catalogs
 *
 * `(i18n/t "key" { params })` reads the active locale's message for `key`
 * from the program's catalogs (`locales/<locale>/<behavior>.json`). Keys are
 * qualified with the behavior's name at lowering, and `orb validate` checks
 * every key against every declared locale's catalog.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

export const I18N_OPERATORS: Record<string, StdOperatorMeta> = {
  'i18n/t': {
    module: 'i18n',
    category: 'std-i18n',
    minArity: 1,
    maxArity: 2,
    description: "The active locale's message for a catalog key, with {{placeholders}} filled from params",
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'key', type: 'string', description: 'Catalog key (a string literal)' },
      { name: 'params', type: 'object', description: 'Values for the message {{placeholders}}', optional: true },
    ],
    example: '["i18n/t", "posts.count", { "n": 3 }] // => "3 posts"',
  },
};

export function getI18nOperators(): string[] {
  return Object.keys(I18N_OPERATORS);
}
