/**
 * Format Module - Display Formatting
 *
 * Provides formatting functions for numbers, currencies, and display values.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { NUMBER, PRIMITIVE_VALUE, STRING, list, shape, nullable } from '../signature.js';

/**
 * Format module operators.
 * All operators return formatted strings and have no side effects.
 */
export const FORMAT_OPERATORS: Record<string, StdOperatorMeta> = {
  'format/number': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 2,
    description: 'Format number with locale grouping and decimal separators. Supported locales: en, en-US, en-GB, en-CA, en-AU, ja, de, pt, pt-BR, nl, fr, es, it, sl, ar, ru (and their -DE/-FR/-ES/-IT/-SI/-NL/-RU/-JP forms); another locale is an error. Rounds half away from zero; with no options the fraction is 0 to 3 digits',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [
      { name: 'n', type: 'number', description: 'Number to format' },
      { name: 'opts', type: shape({ locale: STRING, decimals: NUMBER, minimumFractionDigits: NUMBER, maximumFractionDigits: NUMBER }), description: 'Format options: locale; decimals (both bounds at once) or minimumFractionDigits / maximumFractionDigits', optional: true },
    ],
    example: '["format/number", 1234567.89] // => "1,234,567.89"',
  },
  'format/currency': {
    module: 'format',
    category: 'std-format',
    minArity: 2,
    maxArity: 3,
    description: 'Format as currency, written as English writes it (symbol before the amount, the currency\'s own minor units). Supported currencies: USD EUR GBP JPY CNY INR KRW CAD AUD CHF MXN BRL SEK NOK DKK PLN CZK ZAR NZD SGD HKD AED SAR ILS TRY RUB KWD BHD CLP VND; another currency is an error',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [
      { name: 'n', type: 'number', description: 'Amount' },
      { name: 'currency', type: 'string', description: 'Currency code (USD, EUR, etc.)' },
      { name: 'locale', type: 'string', description: 'Locale (en and en-US)', optional: true, defaultValue: 'en-US' },
    ],
    example: '["format/currency", 1234.56, "USD"] // => "$1,234.56"',
  },
  'format/percent': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 2,
    description: 'Format as percentage (en-US conventions): the value times 100 with `decimals` fraction digits and a percent sign',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [
      { name: 'n', type: 'number', description: 'Number (0.5 = 50%)' },
      { name: 'decimals', type: 'number', description: 'Decimal places', optional: true, defaultValue: 0 },
    ],
    example: '["format/percent", 0.856, 1] // => "85.6%"',
  },
  'format/bytes': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 1,
    description: 'Format bytes as human-readable size (1024 steps, B to PB); a negative or non-finite size is an error',
    hasSideEffects: false,
    failable: {},
    returnType: nullable('string'),
    params: [{ name: 'n', type: 'number', description: 'Bytes' }],
    example: '["format/bytes", 2500000] // => "2.4 MB"',
  },
  'format/ordinal': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 1,
    description: 'Format number as ordinal (1st, 2nd, 3rd)',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'n', type: 'number', description: 'Number' }],
    example: '["format/ordinal", 42] // => "42nd"',
  },
  'format/plural': {
    module: 'format',
    category: 'std-format',
    minArity: 3,
    maxArity: 3,
    description: 'Format count with singular/plural word',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'n', type: 'number', description: 'Count' },
      { name: 'singular', type: 'string', description: 'Singular form' },
      { name: 'plural', type: 'string', description: 'Plural form' },
    ],
    example: '["format/plural", 5, "item", "items"] // => "5 items"',
  },
  'format/list': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 2,
    description: 'Format array as natural language list; `style` is the joining word ("and" or "or")',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'arr', type: list(PRIMITIVE_VALUE), description: 'Array of strings' },
      { name: 'style', type: 'string', description: '"and" or "or"', optional: true, defaultValue: 'and' },
    ],
    example: '["format/list", ["Alice", "Bob", "Charlie"], "and"] // => "Alice, Bob, and Charlie"',
  },
  'format/phone': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 2,
    description: 'Format phone number: `US` (the default) groups 10 digits as (555) 123-4567 and 11 digits led by 1 as +1 (555) 123-4567; any other format, or 10 or more digits otherwise, writes ddd-ddd-rest; fewer than 10 digits are returned as given',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'str', type: 'string', description: 'Phone number digits' },
      { name: 'format', type: 'string', description: 'Format pattern', optional: true, defaultValue: 'US' },
    ],
    example: '["format/phone", "5551234567"] // => "(555) 123-4567"',
  },
  'format/creditCard': {
    module: 'format',
    category: 'std-format',
    minArity: 1,
    maxArity: 1,
    description: 'Format credit card with masked digits',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'str', type: 'string', description: 'Card number' }],
    example: '["format/creditCard", "4111111111111234"] // => "•••• •••• •••• 1234"',
  },
};

/**
 * Get all format operator names.
 */
export function getFormatOperators(): string[] {
  return Object.keys(FORMAT_OPERATORS);
}
