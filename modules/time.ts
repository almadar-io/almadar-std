/**
 * Time Module - Date and Time Operations
 *
 * Provides date manipulation, formatting, and comparison functions.
 *
 * A point in time is ISO-8601 text: a `date` is `YYYY-MM-DD` (no zone), a `datetime` or `instant` carries a zone. Durations are numbers in ms. Every operator here reads and writes UTC, on every execution path: the host's timezone never changes a result.
 * A value shown in a viewer's zone needs a format operator that names its timezone explicitly.
 *
 * Time units: 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'ms'
 * Format tokens: 'YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'ddd', 'MMM'
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { lit, union, nullable, tv } from '../signature.js';

/** The units the kernel's `TimeUnit::parse` accepts (orbital-core `TIME_UNIT_VOCABULARY`), a closed set so a wrong unit is a type error. */
/** A calendar day (`YYYY-MM-DD`) or a moment (ISO-8601 with a zone), all text at run time. */
const POINT: OperatorTypeRef = union('date', 'datetime', 'instant');
/** A moment with a time of day: a bare `date` is refused. */
const MOMENT: OperatorTypeRef = union('datetime', 'instant');

const TIME_UNIT: OperatorTypeRef = union(lit('ms'), lit('millisecond'), lit('milliseconds'), lit('s'), lit('second'), lit('seconds'), lit('m'), lit('minute'), lit('minutes'), lit('h'), lit('hour'), lit('hours'), lit('d'), lit('day'), lit('days'), lit('w'), lit('week'), lit('weeks'), lit('month'), lit('months'), lit('quarter'), lit('quarters'), lit('year'), lit('years'));

/**
 * Time module operators.
 * All operators work with ISO-8601 dates and datetimes and have no side effects.
 */
export const TIME_OPERATORS: Record<string, StdOperatorMeta> = {
  'time/now': {
    module: 'time',
    category: 'std-time',
    minArity: 0,
    maxArity: 0,
    description: 'Current moment as an ISO-8601 instant (UTC)',
    hasSideEffects: false,
    returnType: 'instant',
    params: [],
    example: '["time/now"] // => "2024-01-18T16:00:00.000Z"',
  },
  'time/today': {
    module: 'time',
    category: 'std-time',
    minArity: 0,
    maxArity: 0,
    description: 'Today at midnight UTC as an ISO-8601 instant (the host timezone is never read)',
    hasSideEffects: false,
    returnType: 'instant',
    params: [],
    example: '["time/today"]',
  },
  'time/parse': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Parse ISO 8601 text: text with no time answers a `date` (YYYY-MM-DD); text with a time and a zone answers a UTC `datetime`; an unparseable string, or a date-time without a zone, answers null; any other kind (null included) is a type mismatch',
    hasSideEffects: false,
    failable: {},
    returnType: nullable(union('date', 'datetime')),
    params: [
      { name: 'str', type: union('string', 'date', 'datetime'), description: 'ISO 8601 date (2024-01-18) or date-time with a zone (2024-01-18T09:30:00+02:00)' },
    ],
    example: '["time/parse", "2024-01-18T09:30:00Z"]',
    exampleSource: 'module',
  },
  'time/valid': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'True iff time/parse would succeed on the string (an ISO 8601 date, or a date-time with a zone); a non-string input (null included) is a type mismatch',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'str', type: 'string', description: 'ISO 8601 date or date-time to check' },
    ],
    example: '["time/valid", "2024-01-18T09:30:00Z"] // => true',
  },
  'time/format': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 2,
    description: 'Format a date or datetime to text, in UTC; a time-of-day token (HH, mm, ss, H, m, s) on a bare date is refused',
    hasSideEffects: false,
    returnType: 'string',
    params: [
      { name: 'date', type: POINT, description: 'Date or datetime' },
      { name: 'format', type: 'string', description: 'Format pattern' },
    ],
    example: '["time/format", "2023-11-14T22:13:20Z", "MMM DD, YYYY"]',
  },
  'time/year': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get year from a date or datetime (UTC)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: POINT, description: 'Date or datetime' }],
    example: '["time/year", "2023-11-14T22:13:20Z"] // => 2023',
  },
  'time/month': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get month from a date or datetime (UTC, 1-12)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: POINT, description: 'Date or datetime' }],
    example: '["time/month", "2023-11-14T22:13:20Z"] // => 11',
  },
  'time/day': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get day of month from a date or datetime (UTC, 1-31)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: POINT, description: 'Date or datetime' }],
    example: '["time/day", "2023-11-14T22:13:20Z"] // => 14',
  },
  'time/weekday': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get day of week (UTC, 0=Sunday, 6=Saturday)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: POINT, description: 'Date or datetime' }],
    example: '["time/weekday", "2023-11-14T22:13:20Z"] // => 2 (Tuesday)',
  },
  'time/hour': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get hour from a date or datetime (UTC, 0-23)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date has no time of day and is refused)' }],
    example: '["time/hour", "2023-11-14T22:13:20Z"]',
  },
  'time/minute': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get minute from a date or datetime (UTC, 0-59)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date has no time of day and is refused)' }],
    example: '["time/minute", "2023-11-14T22:13:20Z"]',
  },
  'time/second': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Get second from a date or datetime (UTC, 0-59)',
    hasSideEffects: false,
    returnType: 'number',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date has no time of day and is refused)' }],
    example: '["time/second", "2023-11-14T22:13:20Z"]',
  },
  'time/add': {
    module: 'time',
    category: 'std-time',
    minArity: 3,
    maxArity: 3,
    description: 'Add time to a date or datetime (calendar units in UTC)',
    hasSideEffects: false,
    returnType: tv('T', POINT),
    params: [
      { name: 'date', type: tv('T', POINT), description: 'Date or datetime; the result keeps its shape (a date takes day-or-longer units only)' },
      { name: 'amount', type: 'number', description: 'Amount to add' },
      { name: 'unit', type: TIME_UNIT, description: 'Time unit (year/month/week/day/hour/minute/second/ms)' },
    ],
    example: '["time/add", ["time/now"], 7, "day"]',
  },
  'time/subtract': {
    module: 'time',
    category: 'std-time',
    minArity: 3,
    maxArity: 3,
    description: 'Subtract time from a date or datetime (calendar units in UTC)',
    hasSideEffects: false,
    returnType: tv('T', POINT),
    params: [
      { name: 'date', type: tv('T', POINT), description: 'Date or datetime; the result keeps its shape (a date takes day-or-longer units only)' },
      { name: 'amount', type: 'number', description: 'Amount to subtract' },
      { name: 'unit', type: TIME_UNIT, description: 'Time unit' },
    ],
    example: '["time/subtract", ["time/now"], 1, "hour"]',
  },
  'time/diff': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 3,
    description: 'Signed difference a - b: a number of ms, or of whole units with the third argument',
    hasSideEffects: false,
    returnType: 'number',
    params: [
      { name: 'a', type: POINT, description: 'First date or datetime' },
      { name: 'b', type: POINT, description: 'Second date or datetime' },
      { name: 'unit', type: TIME_UNIT, description: 'Result unit', optional: true, defaultValue: 'ms' },
    ],
    example: '["time/diff", "2023-11-14T22:13:20Z", ["time/now"], "year"]',
  },
  'time/startOf': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 2,
    description: 'Get start of time period (UTC)',
    hasSideEffects: false,
    returnType: tv('T', POINT),
    params: [
      { name: 'date', type: tv('T', POINT), description: 'Date or datetime; the result keeps its shape (a date takes day-or-longer units only)' },
      { name: 'unit', type: TIME_UNIT, description: 'Time unit (year/month/week/day/hour/minute)' },
    ],
    example: '["time/startOf", ["time/now"], "month"]',
  },
  'time/endOf': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 2,
    description: 'Get end of time period (UTC)',
    hasSideEffects: false,
    returnType: tv('T', POINT),
    params: [
      { name: 'date', type: tv('T', POINT), description: 'Date or datetime; the result keeps its shape (a date takes day-or-longer units only)' },
      { name: 'unit', type: TIME_UNIT, description: 'Time unit' },
    ],
    example: '["time/endOf", ["time/now"], "month"]',
  },
  'time/isBefore': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 2,
    description: 'Check if a is before b',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: POINT, description: 'First date or datetime' },
      { name: 'b', type: POINT, description: 'Second date or datetime' },
    ],
    example: '["time/isBefore", "2023-11-14T22:13:20Z", "2023-11-15T22:13:20Z"]',
  },
  'time/isAfter': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 2,
    description: 'Check if a is after b',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: POINT, description: 'First date or datetime' },
      { name: 'b', type: POINT, description: 'Second date or datetime' },
    ],
    example: '["time/isAfter", ["time/now"], "2023-11-14T22:13:20Z"]',
  },
  'time/isBetween': {
    module: 'time',
    category: 'std-time',
    minArity: 3,
    maxArity: 3,
    description: 'Check if date is between start and end',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'date', type: POINT, description: 'Date or datetime to check' },
      { name: 'start', type: POINT, description: 'Range start' },
      { name: 'end', type: POINT, description: 'Range end' },
    ],
    example: '["time/isBetween", ["time/now"], "2023-11-14T22:13:20Z", "2033-05-18T03:33:20Z"]',
  },
  'time/isSame': {
    module: 'time',
    category: 'std-time',
    minArity: 2,
    maxArity: 3,
    description: 'Check if date or datetimes are same (optionally by unit, compared in UTC)',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: POINT, description: 'First date or datetime' },
      { name: 'b', type: POINT, description: 'Second date or datetime' },
      { name: 'unit', type: TIME_UNIT, description: 'Comparison unit', optional: true },
    ],
    example: '["time/isSame", "2023-11-14T22:13:20Z", "2023-11-14T22:30:00Z", "day"]',
  },
  'time/isPast': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Check if date or datetime is in the past',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date is not an instant and is refused)' }],
    example: '["time/isPast", "2023-11-14T22:13:20Z"]',
  },
  'time/isFuture': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Check if date or datetime is in the future',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date is not an instant and is refused)' }],
    example: '["time/isFuture", "2033-05-18T03:33:20Z"]',
  },
  'time/isToday': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Check if date or datetime falls on today\'s UTC date',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'date', type: POINT, description: 'Date or datetime' }],
    example: '["time/isToday", ["time/now"]]',
  },
  'time/relative': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Format as relative time ("2 hours ago", "in 3 days")',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'date', type: MOMENT, description: 'Datetime (a bare date is refused)' }],
    example: '["time/relative", "2023-11-14T22:13:20Z"] // => "2 years ago"',
  },
  'time/duration': {
    module: 'time',
    category: 'std-time',
    minArity: 1,
    maxArity: 1,
    description: 'Format milliseconds as duration ("2h 30m")',
    hasSideEffects: false,
    returnType: 'string',
    params: [{ name: 'ms', type: 'number', description: 'Duration in milliseconds' }],
    example: '["time/duration", 9000000] // => "2h 30m"',
  },
};

/**
 * Get all time operator names.
 */
export function getTimeOperators(): string[] {
  return Object.keys(TIME_OPERATORS);
}
