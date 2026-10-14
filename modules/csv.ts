/**
 * CSV Module - CSV parsing
 *
 * `(csv/parse text)` — pure, deterministic: CSV text → one `Map string string`
 * per data row, keyed by the header row. RFC 4180 quoting; records end in CRLF,
 * LF or CR; blank lines are skipped; a short row's missing cells are "" and a
 * long row's extra cells are dropped. Empty and header-only text → [].
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { STRING, list, mapOf } from '../signature.js';

export const CSV_OPERATORS: Record<string, StdOperatorMeta> = {
  'csv/parse': {
    module: 'csv',
    category: 'std-csv',
    minArity: 1,
    maxArity: 1,
    description: 'Parse CSV text (RFC 4180: quoted fields, "" escapes a quote, quoted line breaks) into one map per data row, keyed by the header row; blank lines are skipped, a short row\'s missing cells are "", empty or header-only text returns []',
    hasSideEffects: false,
    returnType: list(mapOf(STRING, STRING)),
    params: [{ name: 'text', type: 'string', description: 'The CSV text; the first record is the header row' }],
    example: '["csv/parse", "name,age\\nAda,36"] // => [{name: "Ada", age: "36"}]',
  },
};

/**
 * Get all csv operator names.
 */
export function getCsvOperators(): string[] {
  return Object.keys(CSV_OPERATORS);
}
