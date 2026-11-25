import { describe, expect, it } from 'vitest';
import { STD_OPERATORS } from '../registry.js';

const pure = Object.keys(STD_OPERATORS).filter((name) => STD_OPERATORS[name].pure);
const readsLocale = Object.keys(STD_OPERATORS).filter((name) => STD_OPERATORS[name].readsLocale);

describe('the pure flag (EXEC-PERF-2)', () => {
  it('is set on the operators a render callback is built from', () => {
    for (const name of ['+', '=', 'if', 'let', 'default', 'fn', 'as', 'and', 'math/max', 'str/concat', 'array/map', 'array/includes', 'object/get', 'object/set']) {
      expect(STD_OPERATORS[name].pure, name).toBe(true);
    }
  });

  it('is never set on an operator with a side effect or a host', () => {
    for (const name of pure) {
      expect(STD_OPERATORS[name].hasSideEffects, name).toBe(false);
      expect(STD_OPERATORS[name].host, name).toBeUndefined();
    }
  });

  it('is not set on an operator that draws entropy, reads the clock or reads the locale', () => {
    for (const name of ['math/random', 'math/randomInt', 'array/shuffle', 'time/now', 'time/today', 'time/isPast', 'i18n/t', 'i18n/direction', 'prob/flip', 'mem/read']) {
      expect(STD_OPERATORS[name].pure, name).toBeUndefined();
    }
  });

  it('control: the locale readers are the i18n operators, and none of them is pure', () => {
    expect(readsLocale.sort()).toEqual(['i18n/direction', 'i18n/t']);
  });
});
