import { expect, it } from 'vitest';
import canonical from '../canonical-operators.json';
import { STD_OPERATORS } from '../registry.js';

it('render-ui takes a slot and a pattern only (G-CROSS-257: no props argument)', () => {
  expect(STD_OPERATORS['render-ui'].maxArity).toBe(2);
  expect(STD_OPERATORS['render-ui'].params?.map((p) => p.name)).toEqual(['slot', 'pattern']);
  expect(canonical.operators['render-ui'].maxArity).toBe(2);
  expect(canonical.operators['render-ui'].params.map((p) => p.name)).toEqual(['slot', 'pattern']);
});

it('control: render-ui still requires both arguments', () => {
  expect(STD_OPERATORS['render-ui'].minArity).toBe(2);
  expect(canonical.operators['render-ui'].minArity).toBe(2);
});
