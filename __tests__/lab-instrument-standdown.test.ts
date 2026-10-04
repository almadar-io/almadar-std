/**
 * Lab navigation switches instruments at runtime: every instrument trait that renders the main slot
 * and answers MODE_SELECTED must clear that render when a different mode is picked, or the old
 * instrument stays stacked above the new one.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(__dirname, '../behaviors/lolo/ui/learning/atoms');

/** Traits that render main and answer MODE_SELECTED for their matchMode, but never clear main on a different mode. */
function nonClearingInstruments(src: string): string[] {
  const out: string[] = [];
  const parts = src.split(/\n  trait (\w+)/);
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i];
    const body = parts[i + 1];
    if (!body.includes('render-ui main') || !/MODE_SELECTED -> \w+ when \(== (\?mode|@payload\.mode) @config\.matchMode\)/.test(body)) continue;
    const standDown = body.match(/MODE_SELECTED -> \w+ when \(and \(not \(== @config\.matchMode ""\)\) \(not \(== (\?mode|@payload\.mode) @config\.matchMode\)\)\)\n((?: {8}[^\n]*\n)*)/);
    if (!standDown || !standDown[2].includes('(render-ui main null)')) out.push(name);
  }
  return out;
}

describe('lab instruments clear their render on stand-down', () => {
  const files = fs.readdirSync(DIR).filter((f) => f.startsWith('std-learn-') && f.endsWith('.lolo'));

  it('scans the instrument sources', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('every main-rendering instrument clears main when another mode is selected', () => {
    const offenders = files.flatMap((f) => nonClearingInstruments(fs.readFileSync(path.join(DIR, f), 'utf8')).map((t) => `${f}:${t}`));
    expect(offenders).toEqual([]);
  });

  it('control: an instrument whose stand-down only flips flags is flagged', () => {
    const src = [
      '',
      '  trait Sim -> Scene [interaction] {',
      '    state idle {',
      '      MODE_SELECTED -> idle when (and (not (== @config.matchMode "")) (not (== ?mode @config.matchMode)))',
      '        (set @entity.active false)',
      '',
      '      MODE_SELECTED -> idle when (== ?mode @config.matchMode)',
      '        (render-ui main { type: stack })',
      '    }',
      '  }',
    ].join('\n');
    expect(nonClearingInstruments(src)).toEqual(['Sim']);
    expect(nonClearingInstruments(src.replace('(set @entity.active false)', '(set @entity.active false)\n        (render-ui main null)'))).toEqual([]);
  });
});
