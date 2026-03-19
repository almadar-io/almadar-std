/**
 * std-text-effects
 *
 * Text animation and highlighting atom.
 * Absorbs: typewriter-text, text-highlight, law-reference-tooltip.
 *
 * @level atom
 * @family text-effects
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTextEffectsParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TextEffectsConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTextEffectsParams): TextEffectsConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'content') ? [] : [{ name: 'content', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'highlightType') ? [] : [{ name: 'highlightType', type: 'string' as const, default: 'none' }]),
    ...(baseFields.some(f => f.name === 'reference') ? [] : [{ name: 'reference', type: 'string' as const, default: '' }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}TextEffects`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'type',
    pageTitle: params.pageTitle ?? 'Text Effects',
    pageName: params.pageName ?? `${entityName}TextEffectsPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/text-effects`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: TextEffectsConfig): Entity {
  const instances = [
    { id: 'txt-1', name: 'The quick brown fox jumps over the lazy dog', description: 'A pangram sentence', status: 'active', createdAt: '2026-01-01', content: 'The **quick** brown fox _jumps_ over the lazy dog. This demonstrates text animation and highlighting capabilities.', highlightType: 'emphasis', reference: 'Article 42, Section 3.1 — Typography Standards' },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: TextEffectsConfig): Trait {
  const { entityName, displayField, headerIcon, pageTitle } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'markdown-content', content: ef(displayField) },
      { type: 'code-block', code: ef('reference'), language: 'text' },
      { type: 'typography', variant: 'body', content: ef(displayField) },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Animate', event: 'ANIMATE', variant: 'primary', icon: 'play' },
          { type: 'button', label: 'Highlight', event: 'HIGHLIGHT', variant: 'secondary', icon: 'highlighter' },
        ],
      },
    ],
  };

  const animatingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typewriter-text', text: ef(displayField), speed: 50, cursor: true },
      {
        type: 'law-reference-tooltip',
        reference: ef('reference'),
        children: [
          { type: 'typography', variant: 'caption', color: 'muted', content: 'Hover for reference details' },
        ],
      },
      { type: 'button', label: 'Highlight', event: 'HIGHLIGHT', variant: 'secondary', icon: 'highlighter' },
    ],
  };

  const highlightedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'text-highlight', text: ef(displayField), highlightColor: 'yellow', pattern: 'important' },
      {
        type: 'law-reference-tooltip',
        reference: ef('reference'),
        children: [
          { type: 'typography', variant: 'body', content: ef(displayField) },
        ],
      },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'animating' },
        { name: 'highlighted' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ANIMATE', name: 'Animate' },
        { key: 'HIGHLIGHT', name: 'Highlight' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'animating', event: 'ANIMATE', effects: [['render-ui', 'main', animatingView]] },
        { from: 'animating', to: 'highlighted', event: 'HIGHLIGHT', effects: [['render-ui', 'main', highlightedView]] },
        { from: 'highlighted', to: 'idle', event: 'RESET', effects: [['render-ui', 'main', idleView]] },
        { from: 'animating', to: 'idle', event: 'RESET', effects: [['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'highlighted', event: 'HIGHLIGHT', effects: [['render-ui', 'main', highlightedView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: TextEffectsConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdTextEffectsEntity(params: StdTextEffectsParams): Entity { return buildEntity(resolve(params)); }
export function stdTextEffectsTrait(params: StdTextEffectsParams): Trait { return buildTrait(resolve(params)); }
export function stdTextEffectsPage(params: StdTextEffectsParams): Page { return buildPage(resolve(params)); }

export function stdTextEffects(params: StdTextEffectsParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
