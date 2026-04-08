/**
 * std-upload
 *
 * File upload atom with drag-and-drop zone and progress tracking.
 * Absorbs: upload-drop-zone.
 *
 * @level atom
 * @family upload
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

export interface StdUploadParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  acceptedTypes?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface UploadConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  acceptedTypes: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdUploadParams): UploadConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'fileName') ? [] : [{ name: 'fileName', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'fileSize') ? [] : [{ name: 'fileSize', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'uploadStatus') ? [] : [{ name: 'uploadStatus', type: 'string' as const, default: 'idle' }]),
  ];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Upload`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'upload',
    pageTitle: params.pageTitle ?? 'Upload',
    acceptedTypes: params.acceptedTypes ?? '*/*',
    pageName: params.pageName ?? `${entityName}UploadPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/upload`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: UploadConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: UploadConfig): Trait {
  const { entityName, headerIcon, pageTitle, acceptedTypes } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'upload-drop-zone', accept: acceptedTypes, event: 'UPLOAD', multiple: false, maxSize: 10485760 },
    ],
  };

  const uploadingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'upload', size: 'lg' },
          { type: 'typography', content: 'Uploading...', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', content: ef('fileName') },
      { type: 'progress-bar', value: 50, showPercentage: true },
      { type: 'spinner', size: 'md' },
    ],
  };

  const completeView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Upload Complete', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'File uploaded successfully.' },
      { type: 'typography', variant: 'caption', color: 'muted', content: ef('fileName') },
      { type: 'button', label: 'Upload Another', event: 'RESET', variant: 'primary', icon: 'upload' },
    ],
  };

  const errorView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Upload Failed', message: 'Something went wrong. Please try again.', onRetry: 'UPLOAD' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'rotate-ccw' },
          { type: 'button', label: 'Cancel', event: 'RESET', variant: 'ghost' },
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
        { name: 'uploading' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPLOAD', name: 'Upload', payload: [{ name: 'fileName', type: 'string', required: true }] },
        { key: 'COMPLETE', name: 'Complete' },
        { key: 'FAILED', name: 'Failed' },
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'uploading', event: 'UPLOAD', effects: [['set', '@entity.fileName', '@payload.fileName'], ['set', '@entity.uploadStatus', 'uploading'], ['render-ui', 'main', uploadingView]] },
        { from: 'uploading', to: 'complete', event: 'COMPLETE', effects: [['set', '@entity.uploadStatus', 'complete'], ['render-ui', 'main', completeView]] },
        { from: 'uploading', to: 'error', event: 'FAILED', effects: [['set', '@entity.uploadStatus', 'error'], ['render-ui', 'main', errorView]] },
        { from: 'error', to: 'uploading', event: 'RETRY', effects: [['set', '@entity.uploadStatus', 'uploading'], ['render-ui', 'main', uploadingView]] },
        { from: 'error', to: 'idle', event: 'RESET', effects: [['set', '@entity.uploadStatus', 'idle'], ['render-ui', 'main', idleView]] },
        { from: 'complete', to: 'idle', event: 'RESET', effects: [['set', '@entity.uploadStatus', 'idle'], ['render-ui', 'main', idleView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: UploadConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdUploadEntity(params: StdUploadParams): Entity { return buildEntity(resolve(params)); }
export function stdUploadTrait(params: StdUploadParams): Trait { return buildTrait(resolve(params)); }
export function stdUploadPage(params: StdUploadParams): Page { return buildPage(resolve(params)); }

export function stdUpload(params: StdUploadParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
