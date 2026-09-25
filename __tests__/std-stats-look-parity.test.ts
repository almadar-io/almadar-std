// std-stats (G-STD-021): every statsLook body renders a card's value through a node that also takes the card's
// format, so no look shows a raw number (2840000000, 18.5 for a percent) where another shows $2.84B / 18.5%.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Node = string | number | boolean | null | Node[] | { [key: string]: Node };

const orb = JSON.parse(readFileSync(join(__dirname, '../behaviors/registry/ui/core/atoms/std-stats.orb'), 'utf-8')) as {
  orbitals: Array<{ traits: Array<{ config: Record<string, { default: Node }> }> }>;
};
const config = orb.orbitals[0].traits[0].config;
const LOOKS = ['bodyContent', 'kpiTilesBodyContent', 'heroMetricBodyContent', 'sparklineRowBodyContent'];

/** Every object node that binds `@card.value`, with whether it also binds `@card.format`. */
function valueNodes(node: Node, out: Array<{ type: Node; formatted: boolean }> = []): Array<{ type: Node; formatted: boolean }> {
  if (Array.isArray(node)) node.forEach((child) => valueNodes(child, out));
  else if (node !== null && typeof node === 'object') {
    const bound = Object.values(node).includes('@card.value');
    if (bound) out.push({ type: node['type'] ?? null, formatted: node['format'] === '@card.format' });
    Object.values(node).forEach((child) => valueNodes(child, out));
  }
  return out;
}

describe('std-stats look parity', () => {
  it.each(LOOKS)('%s renders the card value with its format', (look) => {
    const nodes = valueNodes(config[look].default);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.filter((n) => !n.formatted)).toEqual([]);
  });
});
