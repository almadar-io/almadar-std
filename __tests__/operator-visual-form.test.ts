import { describe, it, expect } from 'vitest';
import { STD_OPERATORS, operatorVisualForm, OPERATOR_VISUAL_FORMS } from '../registry';

describe('operatorVisualForm — the circuit form every operator declares or derives', () => {
  it('gives every registered operator a known form (totality)', () => {
    const forms = new Set<string>(OPERATOR_VISUAL_FORMS);
    for (const op of Object.keys(STD_OPERATORS)) expect(forms.has(operatorVisualForm(op) ?? ''), op).toBe(true);
  });

  it('uses the declared form of structural operators', () => {
    expect(operatorVisualForm('and')).toBe('series');
    expect(operatorVisualForm('or')).toBe('parallel');
    expect(operatorVisualForm('not')).toBe('invert');
    expect(operatorVisualForm('if')).toBe('branch');
    expect(operatorVisualForm('when')).toBe('branch');
    expect(operatorVisualForm('let')).toBe('scope');
    expect(operatorVisualForm('fn')).toBe('template');
    expect(operatorVisualForm('do')).toBe('ladder');
    expect(operatorVisualForm('async/delay')).toBe('delay');
    expect(operatorVisualForm('async/race')).toBe('parallel');
  });

  it('derives the rest from declared metadata: lambdas convey, effects actuate, the rest are blocks', () => {
    expect(operatorVisualForm('array/map')).toBe('conveyor');
    expect(operatorVisualForm('array/filter')).toBe('conveyor');
    expect(operatorVisualForm('set')).toBe('actuator');
    expect(operatorVisualForm('emit')).toBe('actuator');
    expect(operatorVisualForm('+')).toBe('block');
    expect(operatorVisualForm('str/upper')).toBe('block');
  });

  it('control: an unregistered head has no form', () => {
    expect(operatorVisualForm('made-up')).toBeNull();
  });
});
