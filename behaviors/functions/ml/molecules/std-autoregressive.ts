/**
 * std-autoregressive
 *
 * Autoregressive text generation molecule (GPT-style).
 * Forward pass in a self-transition loop: generates one token at a time
 * until EOS token or max length is reached.
 *
 * State machine:
 *   idle -> generating (on generateEvent, forward)
 *     -> generating (self-loop on tokenEvent, append + forward)
 *     -> idle (on tokenEvent with EOS guard, emit doneEvent)
 *
 * Single trait, single page.
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAutoregressiveParams {
  entityName: string;
  architecture: unknown;
  /** Total vocabulary size */
  vocabSize: number;
  /** Maximum generation length */
  maxLength: number;
  /** Token ID that signals end of sequence */
  eosToken: number;
  /** Event that triggers generation. Default: "GENERATE" */
  generateEvent?: string;
  /** Event emitted per generated token. Default: "TOKEN_READY" */
  tokenEvent?: string;
  /** Event emitted when generation completes. Default: "GENERATION_COMPLETE" */
  doneEvent?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface AutoregressiveConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  vocabSize: number;
  maxLength: number;
  eosToken: number;
  generateEvent: string;
  tokenEvent: string;
  doneEvent: string;
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAutoregressiveParams): AutoregressiveConfig {
  const { entityName } = params;

  const baseFields: EntityField[] = [{ name: 'id', type: 'string', default: '' }];
  const domainFields: EntityField[] = [
    { name: 'generatedTokens', type: 'string', default: '' },
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'lastToken', type: 'number', default: -1 },
    { name: 'genStatus', type: 'string', default: 'idle' },
    { name: 'prompt', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = ensureIdField([...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))]);

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    vocabSize: params.vocabSize,
    maxLength: params.maxLength,
    eosToken: params.eosToken,
    generateEvent: params.generateEvent ?? 'GENERATE',
    tokenEvent: params.tokenEvent ?? 'TOKEN_READY',
    doneEvent: params.doneEvent ?? 'GENERATION_COMPLETE',
    traitName: `${entityName}Autoregressive`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}GeneratePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/generate`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builder
// ============================================================================

function buildTrait(c: AutoregressiveConfig): Trait {
  const { entityName, generateEvent, tokenEvent, doneEvent, vocabSize, maxLength, eosToken } = c;

  // Idle view: prompt input + generate button
  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'message-square', size: 'lg' },
          { type: 'typography', content: `${entityName} Generator`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.genStatus' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Vocab: ${vocabSize} | Max length: ${maxLength}` },
      { type: 'typography', variant: 'body', content: '@entity.generatedTokens' },
      { type: 'button', label: 'Generate', event: generateEvent, variant: 'primary', icon: 'play' },
    ],
  };

  // Generating view: shows tokens accumulating
  const generatingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Generating', variant: 'h3' },
      { type: 'progress-bar', value: '@entity.tokenCount', max: maxLength },
      { type: 'typography', variant: 'body', content: '@entity.generatedTokens' },
      { type: 'typography', variant: 'caption', content: 'Tokens: @entity.tokenCount' },
      { type: 'spinner', size: 'sm' },
    ],
  };

  // Complete view: final output
  const completeView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Generation Complete', variant: 'h3' },
      { type: 'typography', variant: 'body', content: '@entity.generatedTokens' },
      { type: 'typography', variant: 'caption', content: 'Total tokens: @entity.tokenCount' },
      { type: 'button', label: 'Generate Again', event: generateEvent, variant: 'outline', icon: 'refresh-cw' },
    ],
  };

  // Forward pass effect: produces next token logits
  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@entity.generatedTokens',
    'output-contract': { type: 'tensor', shape: [vocabSize], dtype: 'float32', activation: 'softmax' },
    'on-complete': tokenEvent,
  }];

  // EOS guard: checks if the generated token is the EOS token
  const eosGuard: unknown[] = ['eq', '@payload.token', eosToken];

  // Max length guard: checks if we've hit max tokens
  const maxLengthGuard: unknown[] = ['gte', '@entity.tokenCount', maxLength];

  // Combined stop guard: EOS or max length
  const stopGuard: unknown[] = ['or', eosGuard, maxLengthGuard];

  // Continue guard: NOT stop
  const continueGuard: unknown[] = ['not', stopGuard];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [doneEvent],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'generating' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: generateEvent, name: 'Generate' },
        { key: tokenEvent, name: 'Token Ready' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.genStatus', 'idle'],
            ['set', '@entity.generatedTokens', ''],
            ['set', '@entity.tokenCount', 0],
            ['render-ui', 'main', idleView],
          ],
        },
        // GENERATE: idle -> generating (start first forward pass)
        {
          from: 'idle', to: 'generating', event: generateEvent,
          effects: [
            ['set', '@entity.genStatus', 'generating'],
            ['set', '@entity.generatedTokens', ''],
            ['set', '@entity.tokenCount', 0],
            forwardEffect,
            ['render-ui', 'main', generatingView],
          ],
        },
        // TOKEN_READY + continue: generating -> generating (append token, forward again)
        {
          from: 'generating', to: 'generating', event: tokenEvent,
          guard: continueGuard,
          effects: [
            ['set', '@entity.lastToken', '@payload.token'],
            ['set', '@entity.generatedTokens', ['string/concat', '@entity.generatedTokens', '@payload.decoded']],
            ['set', '@entity.tokenCount', ['math/add', '@entity.tokenCount', 1]],
            forwardEffect,
            ['render-ui', 'main', generatingView],
          ],
        },
        // TOKEN_READY + stop: generating -> idle (EOS or max length reached)
        {
          from: 'generating', to: 'idle', event: tokenEvent,
          guard: stopGuard,
          effects: [
            ['set', '@entity.genStatus', 'complete'],
            ['set', '@entity.tokenCount', ['math/add', '@entity.tokenCount', 1]],
            ['emit', doneEvent],
            ['render-ui', 'main', completeView],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdAutoregressiveEntity(params: StdAutoregressiveParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdAutoregressiveTrait(params: StdAutoregressiveParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAutoregressivePage(params: StdAutoregressiveParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: c.traitName }],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAutoregressive(params: StdAutoregressiveParams): OrbitalDefinition {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
  const trait = buildTrait(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: trait.name }],
  } as Page;

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [trait],
    pages: [page],
  } as OrbitalDefinition;
}
