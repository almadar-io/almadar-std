// G-STD-031: an extraTraits[] entry's call-site config reaches the orb stamp in declaration form
// (`{ type, default }`) whether or not a traitOverrides overlay exists — the stamp rejects a bare value.
import { describe, expect, it } from 'vitest';
import { dispatchOrbitalFactory } from '../behaviors/functions/dispatch.js';

const extra = { from: 'std/behaviors/ui-button', as: 'Btn', ref: 'Btn.traits.ButtonRender', name: 'NewButton' };

function extraConfig(params: object): unknown {
  const def = dispatchOrbitalFactory('std-agent-builder', 'AgentBuilderOrbital', params);
  const trait = def?.traits?.find((t) => typeof t === 'object' && 'name' in t && t.name === 'NewButton');
  return trait !== undefined && typeof trait === 'object' && 'config' in trait ? trait.config : undefined;
}

describe('dispatchOrbitalFactory extra-trait config', () => {
  it('a plain value is normalised to a declaration', () => {
    expect(extraConfig({ extraTraits: [{ ...extra, config: { label: 'New' } }] })).toEqual({ label: { type: 'unknown', default: 'New' } });
  });

  it('control: a declaration passes through unchanged', () => {
    const declared = { label: { type: 'string', default: 'New' } };
    expect(extraConfig({ extraTraits: [{ ...extra, config: declared }] })).toEqual(declared);
  });

  it('edge: an overlay still folds into the declaration', () => {
    expect(extraConfig({
      extraTraits: [{ ...extra, config: { label: 'New' } }],
      traitOverrides: { NewButton: { config: { label: 'Renamed' } } },
    })).toEqual({ label: { type: 'unknown', default: 'Renamed' } });
  });

  it('edge: an entry without config gets none', () => {
    expect(extraConfig({ extraTraits: [extra] })).toBeUndefined();
  });
});
