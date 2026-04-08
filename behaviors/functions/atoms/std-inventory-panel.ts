/**
 * std-inventory-panel
 *
 * Grid-based inventory atom using the `inventory-panel` pattern.
 * Shows items in a grid with select, use, and drop actions.
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField, EntityRow } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdInventoryPanelParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Number of columns in inventory grid */
  columns?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface InventoryPanelConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  columns: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdInventoryPanelParams): InventoryPanelConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}InventoryPanel`,
    columns: params.columns ?? 4,
    pageName: params.pageName ?? `${entityName}InventoryPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: InventoryPanelConfig): Entity {
  const fields = [
    ...c.fields.filter(f => f.name !== 'items'),
    { name: 'items', type: 'array' as const },
  ];
  return makeEntity({
    name: c.entityName,
    fields,
    persistence: 'singleton',
    instances: [{
      id: 'inventory',
      items: [
        { id: 'item-0', name: 'Iron Sword', quantity: 1, rarity: 'common' },
        { id: 'item-1', name: 'Health Potion', quantity: 3, rarity: 'common' },
        { id: 'item-2', name: 'Shield', quantity: 1, rarity: 'uncommon' },
        { id: 'item-3', name: 'Magic Scroll', quantity: 2, rarity: 'rare' },
        { id: 'item-4', name: 'Gold Ring', quantity: 1, rarity: 'epic' },
        { id: 'item-5', name: 'Dragon Scale', quantity: 1, rarity: 'epic' },
      ],
    } as unknown as EntityRow],
  });
}

function buildTrait(c: InventoryPanelConfig): Trait {
  const { entityName, columns } = c;

  const inventoryView = {
    type: 'inventory-panel',
    items: '@entity.items',
    slots: columns * 4,
    columns,
    selectSlotEvent: 'SELECT_SLOT',
    useItemEvent: 'USE_ITEM',
    dropItemEvent: 'DROP_ITEM',
    showTooltips: true,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SELECT_SLOT', name: 'Select Slot', payload: [{ name: 'slotId', type: 'string', required: true }] },
        { key: 'USE_ITEM', name: 'Use Item', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: 'DROP_ITEM', name: 'Drop Item', payload: [{ name: 'id', type: 'string', required: true }] },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', inventoryView]] },
        { from: 'idle', to: 'idle', event: 'SELECT_SLOT', effects: [['render-ui', 'main', inventoryView]] },
        { from: 'idle', to: 'idle', event: 'USE_ITEM', effects: [['fetch', entityName], ['render-ui', 'main', inventoryView]] },
        { from: 'idle', to: 'idle', event: 'DROP_ITEM', effects: [['persist', 'delete', entityName, '@payload.id'], ['fetch', entityName], ['render-ui', 'main', inventoryView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: InventoryPanelConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdInventoryPanelEntity(params: StdInventoryPanelParams): Entity { return buildEntity(resolve(params)); }
export function stdInventoryPanelTrait(params: StdInventoryPanelParams): Trait { return buildTrait(resolve(params)); }
export function stdInventoryPanelPage(params: StdInventoryPanelParams): Page { return buildPage(resolve(params)); }

export function stdInventoryPanel(params: StdInventoryPanelParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
