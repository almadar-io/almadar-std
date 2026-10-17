import { expect, it } from 'vitest';
import pkg from '../package.json';

it('places declaration conditions before runtime conditions without changing targets', () => {
  for (const entry of [pkg.exports['.'], pkg.exports['./modules/*'], pkg.exports['./registry']]) {
    expect(Object.keys(entry)).toEqual(['types', 'import', 'require']);
    expect(entry.types).toMatch(/\.d\.ts$/);
    expect(entry.import).toEqual(entry.require);
  }
});
