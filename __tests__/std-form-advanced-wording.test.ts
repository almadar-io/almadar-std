// std-form-advanced (G-STD-033): a call site words the form's buttons and its confirmation. Every form-section
// the trait renders takes submitLabel/cancelLabel/showCancel from config, and the SUBMIT confirmation reads its
// title, message and new-entry label from config, whose defaults keep today's copy.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Node = string | number | boolean | null | Node[] | { [key: string]: Node };

interface Transition { from: string; event: string; effects: Node[] }

const orb = JSON.parse(readFileSync(join(__dirname, '../behaviors/registry/ui/core/atoms/std-form-advanced.orb'), 'utf-8')) as {
  orbitals: Array<{ traits: Array<{ config: Record<string, { default?: Node }>; stateMachine: { transitions: Transition[] } }> }>;
};
const trait = orb.orbitals[0].traits[0];

function nodesOfType(node: Node, type: string, out: Array<Record<string, Node>> = []): Array<Record<string, Node>> {
  if (Array.isArray(node)) node.forEach((child) => nodesOfType(child, type, out));
  else if (node !== null && typeof node === 'object') {
    if (node['type'] === type) out.push(node);
    Object.values(node).forEach((child) => nodesOfType(child, type, out));
  }
  return out;
}

const renderOf = (from: string, event: string): Node => {
  const t = trait.stateMachine.transitions.find((x) => x.from === from && x.event === event);
  if (t === undefined) throw new Error(`no ${from} --${event}-->`);
  return t.effects;
};

describe('std-form-advanced wording knobs', () => {
  const forms = trait.stateMachine.transitions.flatMap((t) => nodesOfType(t.effects, 'form-section'));

  it('renders at least one form-section', () => {
    expect(forms.length).toBeGreaterThan(0);
  });

  it.each(['submitLabel', 'cancelLabel', 'showCancel'])('every form-section forwards %s from config', (knob) => {
    expect(forms.map((f) => f[knob])).toEqual(forms.map(() => `@config.${knob}`));
    expect(trait.config[knob]).toBeDefined();
  });

  it('leaves the button labels unset by default so the form keeps its translated Save/Cancel', () => {
    expect(trait.config['submitLabel'].default).toBeUndefined();
    expect(trait.config['cancelLabel'].default).toBeUndefined();
  });

  it('the SUBMIT confirmation reads its copy from config, defaulting to the current wording', () => {
    const effects = renderOf('editing', 'SUBMIT');
    expect(nodesOfType(effects, 'typography').map((n) => n['content'])).toContain('@config.successTitle');
    expect(nodesOfType(effects, 'alert').map((n) => n['message'])).toEqual(['@config.successMessage']);
    expect(nodesOfType(effects, 'button').map((n) => n['label'])).toEqual(['@config.newEntryLabel']);
    expect(trait.config['successTitle'].default).toBe('Form Submitted');
    expect(trait.config['successMessage'].default).toBe('Your form has been submitted successfully.');
    expect(trait.config['newEntryLabel'].default).toBe('New Entry');
  });
});
