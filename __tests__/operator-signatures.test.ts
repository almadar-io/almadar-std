import { describe, it, expect } from 'vitest';
import { STD_OPERATORS } from '../registry.js';
import canonical from '../canonical-operators.json';
import { formatOperatorType, keyOf, fieldOf, list, tv, rec } from '../signature.js';
import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';

const GENERIC_NAMES = ['any', 'unknown', 'json', 'object', 'array', 'lambda', 'function', 'expression', 'Json', 'scalar'];
const VARIABLES = ['T', 'U', 'K', 'V', 'R', 'A', 'B', 'E', 'P', 'S', 'O', 'J'];

interface Position {
  op: string;
  where: string;
  type: OperatorTypeRef;
}

function positions(): Position[] {
  const out: Position[] = [];
  for (const [op, meta] of Object.entries(STD_OPERATORS)) {
    for (const p of meta.params ?? []) out.push({ op, where: `param ${p.name}`, type: p.type });
    out.push({ op, where: 'returnType', type: meta.returnType });
    if (meta.effect?.produces) out.push({ op, where: 'effect.produces', type: meta.effect.produces });
    for (const [key, type] of Object.entries(meta.effect?.config ?? {})) out.push({ op, where: `effect.config.${key}`, type });
  }
  return out;
}

/** Every type reachable from `type`, with the path to it. */
function walk(type: OperatorTypeRef, path: string, visit: (t: OperatorTypeRef, path: string) => void): void {
  visit(type, path);
  if (typeof type === 'string') return;
  switch (type.kind) {
    case 'union':
      type.of.forEach((m, i) => walk(m, `${path}|${i}`, visit));
      return;
    case 'array':
      walk(type.of, `${path}[]`, visit);
      return;
    case 'tuple':
      type.items.forEach((m, i) => walk(m, `${path}.${i}`, visit));
      return;
    case 'map':
      walk(type.key, `${path}.key`, visit);
      walk(type.value, `${path}.value`, visit);
      return;
    case 'object':
      for (const [k, v] of Object.entries(type.fields)) walk(v, `${path}.${k}`, visit);
      return;
    case 'binding':
      if (type.shape) walk(type.shape, `${path}.shape`, visit);
      return;
    case 'sexpr':
      if (type.of) walk(type.of, `${path}.of`, visit);
      return;
    case 'var':
      if (type.bound) walk(type.bound, `${path}.bound`, visit);
      return;
    case 'fn':
      type.params.forEach((m, i) => walk(m, `${path}.p${i}`, visit));
      walk(type.returns, `${path}.returns`, visit);
      return;
    default:
      return;
  }
}

function variablesOf(type: OperatorTypeRef): Map<string, { record: boolean; each: boolean }> {
  const found = new Map<string, { record: boolean; each: boolean }>();
  walk(type, '', (t) => {
    if (typeof t !== 'string' && t.kind === 'var') {
      const prior = found.get(t.name);
      let record = false;
      if (t.bound) walk(t.bound, '', (b) => { if (typeof b !== 'string' && b.kind === 'record') record = true; });
      found.set(t.name, { record: record || prior?.record === true, each: t.each === true || prior?.each === true });
    }
  });
  return found;
}

describe('operator table: no generic types', () => {
  it('names no generic type in any params, returnType or effect position', () => {
    const offenders: string[] = [];
    for (const { op, where, type } of positions()) {
      walk(type, where, (t, path) => {
        if (typeof t === 'string') {
          const base = t.replace(/\[\]$/, '');
          if (GENERIC_NAMES.includes(base) || t.includes('[') || t.includes('|')) offenders.push(`${op} ${path}: ${t}`);
        } else if (t.kind === 'object' && Object.keys(t.fields).length === 0) {
          offenders.push(`${op} ${path}: empty object`);
        } else if (t.kind === 'record' && !path.includes('.bound')) {
          offenders.push(`${op} ${path}: record outside a variable bound`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the generated JSON carries no generic type either', () => {
    const text = JSON.stringify(canonical.operators);
    for (const name of GENERIC_NAMES) {
      expect(text.includes(`"type":"${name}"`), `type "${name}"`).toBe(false);
      expect(text.includes(`"returnType":"${name}"`), `returnType "${name}"`).toBe(false);
    }
    expect(text.includes('"fields":{}')).toBe(false);
  });

  it('control: the gate sees a generic type when one is introduced', () => {
    const bad: StdOperatorMeta = { ...STD_OPERATORS['array/len'], params: [{ name: 'arr', type: 'array', description: '' }] };
    const found: string[] = [];
    for (const p of bad.params ?? []) walk(p.type, p.name, (t) => typeof t === 'string' && GENERIC_NAMES.includes(t) && found.push(t));
    expect(found).toEqual(['array']);
  });
});

describe('operator table: signatures are well formed', () => {
  it('uses only the declared type variables', () => {
    for (const { op, where, type } of positions()) {
      for (const name of variablesOf(type).keys()) expect(VARIABLES, `${op} ${where}`).toContain(name);
    }
  });

  it('binds every variable of the result in the parameters', () => {
    const unbound: string[] = [];
    for (const [op, meta] of Object.entries(STD_OPERATORS)) {
      if (meta.hasSideEffects) continue;
      const bound = new Set<string>();
      for (const p of meta.params ?? []) for (const name of variablesOf(p.type).keys()) bound.add(name);
      for (const name of variablesOf(meta.returnType).keys()) if (!bound.has(name)) unbound.push(`${op}: ${name}`);
    }
    expect(unbound).toEqual([]);
  });

  it('ties key-of / field-of / pick-of / omit-of / merge-of to a variable of the same signature', () => {
    const problems: string[] = [];
    for (const [op, meta] of Object.entries(STD_OPERATORS)) {
      const records = new Set<string>();
      const declared = new Set<string>();
      for (const p of meta.params ?? []) {
        for (const [n, v] of variablesOf(p.type)) {
          declared.add(n);
          if (v.record) records.add(n);
        }
      }
      const visit = (t: OperatorTypeRef, path: string): void => {
        if (typeof t === 'string') return;
        // A key-of over an element variable (`array/sort`'s key) names a field when the element is a record and is absent otherwise.
        if (t.kind === 'keyOf' && !declared.has(t.of)) problems.push(`${op} ${path}: ${formatOperatorType(t)}`);
        if ((t.kind === 'fieldOf' || t.kind === 'pickOf' || t.kind === 'omitOf' || t.kind === 'mergeOf') && !records.has(t.of)) {
          problems.push(`${op} ${path}: ${formatOperatorType(t)}`);
        }
      };
      for (const p of meta.params ?? []) walk(p.type, p.name, visit);
      walk(meta.returnType, 'returnType', visit);
    }
    expect(problems).toEqual([]);
  });

  it('a fieldOf result needs the keyOf parameter of the same variable', () => {
    for (const [op, meta] of Object.entries(STD_OPERATORS)) {
      let fieldResult = false;
      walk(meta.returnType, 'returnType', (t) => {
        if (typeof t !== 'string' && t.kind === 'fieldOf') fieldResult = true;
      });
      if (!fieldResult) continue;
      let keyed = false;
      for (const p of meta.params ?? []) {
        walk(p.type, p.name, (t) => {
          if (typeof t !== 'string' && t.kind === 'keyOf') keyed = true;
        });
      }
      expect(keyed, op).toBe(true);
    }
  });

  it('prints the grammar the owner approved', () => {
    const text = (op: string): string => {
      const meta = STD_OPERATORS[op];
      return `${(meta.params ?? []).map((p) => formatOperatorType(p.type)).join(', ')} -> ${formatOperatorType(meta.returnType)}`;
    };
    expect(text('array/first')).toBe('[T] -> T');
    expect(text('array/append')).toBe('[T], T -> [T]');
    expect(text('=')).toBe('T, T -> boolean');
    expect(text('if')).toBe('boolean, T, T -> T');
    expect(text('array/map')).toBe('[T], (T) -> U -> [U]');
    expect(text('array/filter')).toBe('[T], (T) -> boolean -> [T]');
    expect(text('array/reduce')).toBe('[T], A, (A, T) -> A -> A');
    expect(text('object/get')).toBe('R, key-of R, field-of R -> field-of R');
    expect(text('json/parse')).toBe('string, Shape -> Shape');
  });

  it('control: the builders print their own grammar', () => {
    expect(formatOperatorType(list(tv('T')))).toBe('[T]');
    expect(formatOperatorType(keyOf('R'))).toBe('key-of R');
    expect(formatOperatorType(fieldOf('R'))).toBe('field-of R');
    expect(formatOperatorType(rec('R'))).toBe('R');
  });
});
