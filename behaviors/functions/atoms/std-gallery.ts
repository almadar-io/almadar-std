/**
 * std-gallery
 *
 * Image gallery atom with carousel browsing and lightbox viewing.
 * Absorbs: carousel, lightbox.
 *
 * @level atom
 * @family gallery
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

export interface StdGalleryParams {
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

interface GalleryConfig {
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

function resolve(params: StdGalleryParams): GalleryConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'imageUrl') ? [] : [{ name: 'imageUrl', type: 'string' as const, default: 'https://picsum.photos/seed/gallery/800/600' }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Gallery`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'image',
    pageTitle: params.pageTitle ?? `${p} Gallery`,
    pageName: params.pageName ?? `${entityName}GalleryPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/gallery`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GalleryConfig): Entity {
  const instances = Array.from({ length: 9 }, (_, i) => ({
    id: `img-${i + 1}`,
    name: ['Mountain Peak', 'Ocean Sunset', 'Forest Trail', 'City Skyline', 'Desert Dunes', 'Northern Lights', 'Coral Reef', 'Autumn Leaves', 'Snowy Valley'][i],
    description: `Gallery image ${i + 1}`,
    status: ['active', 'active', 'active', 'pending', 'active', 'active', 'inactive', 'active', 'active'][i],
    createdAt: '2026-01-15',
    imageUrl: `https://picsum.photos/seed/gallery${i + 1}/800/600`,
  }));
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: GalleryConfig): Trait {
  const { entityName, displayField, headerIcon, pageTitle } = c;

  const sampleImages = [
    { src: 'https://picsum.photos/seed/gallery1/800/600', alt: 'Mountain landscape', caption: 'Mountain landscape' },
    { src: 'https://picsum.photos/seed/gallery2/800/600', alt: 'Ocean sunset', caption: 'Ocean sunset' },
    { src: 'https://picsum.photos/seed/gallery3/800/600', alt: 'Forest trail', caption: 'Forest trail' },
  ];

  const browsingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'typography', variant: 'caption', color: 'muted', content: 'Click any image to view full size' },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName,
        cols: 3,
        gap: 'md',
        imageField: 'imageUrl',
        emptyIcon: 'image',
        emptyTitle: 'No images yet',
        emptyDescription: 'Add images to your gallery.',
        itemActions: [{ label: 'View', event: 'VIEW', icon: 'maximize' }],
        columns: [
          { name: 'name', label: 'Title', variant: 'h4' },
          { name: 'status', label: 'Status', variant: 'badge' },
        ],
      },
    ],
  };

  const viewingView = {
    type: 'lightbox', isOpen: true, closeAction: 'CLOSE',
    images: sampleImages,
    currentIndex: 0,
    showCounter: true,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'browsing', isInitial: true },
        { name: 'viewing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'VIEW', name: 'View', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        { from: 'browsing', to: 'browsing', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', browsingView]] },
        { from: 'browsing', to: 'viewing', event: 'VIEW', effects: [['render-ui', 'modal', viewingView]] },
        { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null], ['render-ui', 'main', browsingView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: GalleryConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGalleryEntity(params: StdGalleryParams): Entity { return buildEntity(resolve(params)); }
export function stdGalleryTrait(params: StdGalleryParams): Trait { return buildTrait(resolve(params)); }
export function stdGalleryPage(params: StdGalleryParams): Page { return buildPage(resolve(params)); }

export function stdGallery(params: StdGalleryParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
