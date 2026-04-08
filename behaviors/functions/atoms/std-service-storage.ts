/**
 * std-service-storage
 *
 * Storage service integration behavior: upload, download, list, delete files.
 * Wraps the `storage` service with separate events for each operation.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
 * @family service
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceStorageParams {
  /** Entity name in PascalCase (default: "StorageFile") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, storage fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the storage form to main. Default true. */
  standalone?: boolean;
  /** Default bucket name (default: "uploads") */
  defaultBucket?: string;
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface StorageConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  defaultBucket: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceStorageParams): StorageConfig {
  const entityName = params.entityName ?? 'StorageFile';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'bucket', type: 'string', default: params.defaultBucket ?? 'uploads' },
    { name: 'fileKey', type: 'string' },
    { name: 'prefix', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'storageStatus', type: 'string', default: 'idle' },
    { name: 'result', type: 'string' },
    { name: 'error', type: 'string' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Storage`,
    standalone: params.standalone ?? true,
    defaultBucket: params.defaultBucket ?? 'uploads',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: StorageConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: StorageConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const idleChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
      children: [
        { type: 'icon', name: 'hard-drive', size: 'lg' },
        { type: 'typography', content: `${entityName} Storage`, variant: 'h2' },
      ],
    },
    { type: 'divider' },
  ];

  if (standalone) {
    idleChildren.push(
      { type: 'input', label: 'Bucket', bind: '@entity.bucket', placeholder: 'bucket-name' },
      { type: 'input', label: 'File Key', bind: '@entity.fileKey', placeholder: 'path/to/file.txt' },
      { type: 'input', label: 'Prefix', bind: '@entity.prefix', placeholder: 'path/prefix/' },
      { type: 'textarea', label: 'Content', bind: '@entity.content', placeholder: 'File content...' },
    );
  }

  idleChildren.push(
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
      children: [
        { type: 'button', label: 'Upload', event: 'UPLOAD_FILE', variant: 'primary', icon: 'upload' },
        { type: 'button', label: 'Download', event: 'DOWNLOAD_FILE', variant: 'secondary', icon: 'download' },
        { type: 'button', label: 'List', event: 'LIST_FILES', variant: 'secondary', icon: 'list' },
        { type: 'button', label: 'Delete', event: 'DELETE_FILE', variant: 'destructive', icon: 'trash-2' },
      ],
    },
  );

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: idleChildren,
  };

  const executingUI = {
    type: 'loading-state', title: 'Processing...', message: `Executing storage operation on ${entityName.toLowerCase()}...`,
  };

  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Operation completed successfully' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.result' },
      { type: 'button', label: 'Back', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Operation Failed', message: '@entity.error' },
      { type: 'button', label: 'Back', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // ---- Transitions ----

  const initEffects: unknown[] = [['fetch', entityName]];
  if (standalone) {
    initEffects.push(['render-ui', 'main', idleUI]);
  }

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render form)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: initEffects,
    },
    // UPLOAD_FILE: idle -> executing
    {
      from: 'idle', to: 'executing', event: 'UPLOAD_FILE',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'storage', 'upload', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
          content: '@entity.content',
        }],
      ],
    },
    // DOWNLOAD_FILE: idle -> executing
    {
      from: 'idle', to: 'executing', event: 'DOWNLOAD_FILE',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'storage', 'download', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
        }],
      ],
    },
    // LIST_FILES: idle -> executing
    {
      from: 'idle', to: 'executing', event: 'LIST_FILES',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'storage', 'list', {
          bucket: '@entity.bucket',
          prefix: '@entity.prefix',
        }],
      ],
    },
    // DELETE_FILE: idle -> executing
    {
      from: 'idle', to: 'executing', event: 'DELETE_FILE',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'storage', 'delete', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
        }],
      ],
    },
    // EXECUTED: executing -> complete (set result)
    {
      from: 'executing', to: 'complete', event: 'EXECUTED',
      effects: [
        ['set', '@entity.result', '@payload.data'],
        ['set', '@entity.storageStatus', 'complete'],
        ['render-ui', 'main', completeUI],
      ],
    },
    // FAILED: executing -> error (set error)
    {
      from: 'executing', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.storageStatus', 'error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RESET: complete -> idle
    {
      from: 'complete', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.storageStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.storageStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'executing' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPLOAD_FILE', name: 'Upload File' },
        { key: 'DOWNLOAD_FILE', name: 'Download File' },
        { key: 'LIST_FILES', name: 'List Files' },
        { key: 'DELETE_FILE', name: 'Delete File' },
        { key: 'EXECUTED', name: 'Executed', payload: [
          { name: 'data', type: 'string', required: true },
        ]},
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: StorageConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceStorageEntity(params: StdServiceStorageParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceStorageTrait(params: StdServiceStorageParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceStoragePage(params: StdServiceStorageParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceStorage(params: StdServiceStorageParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
