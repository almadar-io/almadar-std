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
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

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
    { name: 'spritesheet', type: 'string', default: 'https://almadar-kflow-assets.web.app/shared/sprite-sheets/amir-sprite-sheet-se.png' },
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
    type: 'stack',
    direction: 'vertical',
    gap: 'md',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'sm',
        align: 'center',
        children: [
          { type: 'icon', name: 'image', size: 'lg' },
          { type: 'typography', content: `${entityName} Sprite`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'box',
        className: 'relative bg-gray-900 rounded-lg overflow-hidden',
        style: { width: `${frameWidth * scale * 4}px`, height: `${frameHeight * scale * 4}px`, margin: '0 auto' },
        children: [
          {
            type: 'sprite',
            spritesheet: `@${entityName}.spritesheet`,
            frameWidth,
            frameHeight,
            frame: `@${entityName}.frame`,
            x: frameWidth * scale,
            y: frameHeight * scale,
            scale,
          },
        ],
      },
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'md',
        justify: 'center',
        children: [
          { type: 'typography', content: `Frame: `, variant: 'caption', color: 'muted' },
          { type: 'badge', content: `@${entityName}.frame`, variant: 'default' },
          { type: 'typography', content: `Position: `, variant: 'caption', color: 'muted' },
          { type: 'badge', content: ['concat', `@${entityName}.x`, ',', `@${entityName}.y`], variant: 'default' },
        ],
      },
    ],
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

export function stdSprite(params: StdSpriteParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
