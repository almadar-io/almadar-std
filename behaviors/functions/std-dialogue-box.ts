/**
 * std-dialogue-box
 *
 * RPG dialogue atom using the `dialogue-box` pattern.
 * Shows speaker, portrait, typewriter text, and choices.
 *
 * @level atom
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdDialogueBoxParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Typewriter speed in ms per character */
  typewriterSpeed?: number;
  /** Position: top, bottom, center */
  position?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface DialogueConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  typewriterSpeed: number;
  position: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdDialogueBoxParams): DialogueConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'speaker') ? [] : [{ name: 'speaker', type: 'string' as const, default: 'Narrator' }]),
    ...(baseFields.some(f => f.name === 'text') ? [] : [{ name: 'text', type: 'string' as const, default: 'Welcome, adventurer. Your journey begins here.' }]),
  ];

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Dialogue`,
    typewriterSpeed: params.typewriterSpeed ?? 30,
    position: params.position ?? 'bottom',
    pageName: params.pageName ?? `${entityName}DialoguePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: DialogueConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: DialogueConfig): Trait {
  const { entityName, typewriterSpeed, position } = c;

  const dialogueView = {
    type: 'dialogue-box',
    dialogue: {
      speaker: `@entity.speaker`,
      text: `@entity.text`,
    },
    typewriterSpeed,
    position,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'talking', isInitial: true },
        { name: 'idle' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ADVANCE', name: 'Advance' },
        { key: 'CHOICE', name: 'Choice', payload: [{ name: 'choiceId', type: 'string', required: true }] },
        { key: 'COMPLETE', name: 'Complete' },
        { key: 'START_DIALOGUE', name: 'Start Dialogue' },
      ],
      transitions: [
        // INIT sets initial dialogue content then renders
        { from: 'talking', to: 'talking', event: 'INIT', effects: [
          ['fetch', entityName],
          ['set', '@entity.speaker', 'Narrator'],
          ['set', '@entity.text', 'Welcome, adventurer. Your journey begins here.'],
          ['render-ui', 'main', dialogueView],
        ] },
        { from: 'talking', to: 'talking', event: 'ADVANCE', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', dialogueView],
        ] },
        { from: 'talking', to: 'talking', event: 'CHOICE', effects: [
          ['render-ui', 'main', dialogueView],
        ] },
        { from: 'talking', to: 'idle', event: 'COMPLETE', effects: [
          ['render-ui', 'main', {
            type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
            children: [
              { type: 'typography', content: 'Dialogue complete', variant: 'caption' },
              { type: 'button', label: 'New Dialogue', event: 'START_DIALOGUE', variant: 'primary', icon: 'message-circle' },
            ],
          }],
        ] },
        { from: 'idle', to: 'talking', event: 'START_DIALOGUE', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', dialogueView],
        ] },
      ],
    },
  } as Trait;
}

function buildPage(c: DialogueConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdDialogueBoxEntity(params: StdDialogueBoxParams): Entity { return buildEntity(resolve(params)); }
export function stdDialogueBoxTrait(params: StdDialogueBoxParams): Trait { return buildTrait(resolve(params)); }
export function stdDialogueBoxPage(params: StdDialogueBoxParams): Page { return buildPage(resolve(params)); }

export function stdDialogueBox(params: StdDialogueBoxParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
