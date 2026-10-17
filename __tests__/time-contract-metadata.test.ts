import { expect, it } from 'vitest';
import canonical from '../canonical-operators.json';
import { STD_OPERATORS } from '../registry.js';

it('uses the authoritative one-argument time/parse example', () => {
  expect(STD_OPERATORS['time/parse'].maxArity).toBe(1);
  expect(STD_OPERATORS['time/parse'].exampleSource).toBe('module');
  expect(canonical.operators['time/parse'].docsSource).toBe('module');
  expect(canonical.operators['time/parse'].examples).toEqual(['(time/parse "2024-01-18T09:30:00Z")']);
});

it('control: retains curated documentation ownership for unchanged operators', () => {
  expect(canonical.operators['time/format'].docsSource).toBe('reference-docs');
  expect(canonical.operators['time/format'].examples.length).toBeGreaterThan(0);
});
