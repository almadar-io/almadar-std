/**
 * std-sprite
 *
 * Sprite renderer atom using the `sprite` pattern.
 * Renders a single frame from a spritesheet with position and scale.
 * Handles frame changes and click events.
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

export interface StdSpriteParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Width of each frame in pixels */
  frameWidth?: number;
  /** Height of each frame in pixels */
  frameHeight?: number;
  /** Scale factor */
  scale?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface SpriteConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdSpriteParams): SpriteConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by render-ui bindings (@Entity.x, @Entity.y, @Entity.frame, @Entity.spritesheet)
  const domainFields: EntityField[] = [
    { name: 'x', type: 'number', default: 0 },
    { name: 'y', type: 'number', default: 0 },
    { name: 'frame', type: 'number', default: 0 },
    { name: 'spritesheet', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Sprite`,
    frameWidth: params.frameWidth ?? 64,
    frameHeight: params.frameHeight ?? 64,
    scale: params.scale ?? 1,
    pageName: params.pageName ?? `${entityName}SpritePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: SpriteConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SpriteConfig): Trait {
  const { entityName, frameWidth, frameHeight, scale } = c;

  const spriteView = {
    type: 'sprite',
    spritesheet: `@${entityName}.spritesheet`,
    frameWidth,
    frameHeight,
    frame: `@${entityName}.frame`,
    x: `@${entityName}.x`,
    y: `@${entityName}.y`,
    scale,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SET_FRAME', name: 'Set Frame', payload: [{ name: 'frame', type: 'number', required: true }] },
        { key: 'CLICK', name: 'Click' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', spriteView]] },
        { from: 'idle', to: 'idle', event: 'SET_FRAME', effects: [['render-ui', 'main', spriteView]] },
        { from: 'idle', to: 'idle', event: 'CLICK', effects: [] },
      ],
    },
  } as Trait;
}

function buildPage(c: SpriteConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdSpriteEntity(params: StdSpriteParams): Entity { return buildEntity(resolve(params)); }
export function stdSpriteTrait(params: StdSpriteParams): Trait { return buildTrait(resolve(params)); }
export function stdSpritePage(params: StdSpriteParams): Page { return buildPage(resolve(params)); }

export function stdSprite(params: StdSpriteParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
