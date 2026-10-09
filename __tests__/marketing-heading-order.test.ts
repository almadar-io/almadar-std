import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseOrbitalSchema, isJsonObject, type JsonValue, type JsonObject } from '@almadar/core';

function typographyNodes(value: JsonValue): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(typographyNodes);
  if (!isJsonObject(value)) return [];
  return [...(value.type === 'typography' ? [value] : []), ...Object.values(value).flatMap(typographyNodes)];
}

describe('marketing heading semantics preserve visual variants', () => {
  it.each([{ name: 'std-card-grid', size: 'xl' }, { name: 'std-steps', size: 'lg' }])('$name selects h3 below its section heading and h2 without one', ({ name, size }) => {
    const raw = readFileSync(join(__dirname, `../behaviors/registry/ui/core/atoms/${name}.orb`), 'utf8');
    parseOrbitalSchema(JSON.parse(raw));
    const nodes = typographyNodes(JSON.parse(raw));
    expect(nodes.some(node => node.variant === 'h2' && node.content === '@config.heading')).toBe(true);
    const titles = nodes.filter(node => Array.isArray(node.content) && node.content[0] === 'object/get' && node.content[2] === 'title');
    expect(titles).toHaveLength(1);
    expect(titles[0]).toMatchObject({ type: 'typography', variant: ['if', ['==', '@config.heading', ''], 'h2', 'h3'], weight: 'semibold', size });
  });
  it('keeps the footer brand a heading with its original h5 styling', () => {
    const raw = readFileSync(join(__dirname, '../behaviors/registry/ui/core/atoms/std-site-footer.orb'), 'utf8');
    parseOrbitalSchema(JSON.parse(raw));
    expect(typographyNodes(JSON.parse(raw)).find(node => node.content === '@config.brandName')).toMatchObject({ variant: 'h2', weight: 'bold', size: 'lg' });
  });
});
