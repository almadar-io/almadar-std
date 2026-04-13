/**
 * std-validate-on-save
 *
 * OS trigger that watches .orb files and validates them on save.
 * Shows a status dashboard with validation results.
 * Emits AGENT_INTERRUPT with validation results to interrupt
 * autonomous agents with ground truth.
 *
 * @level atom
 * @family os-trigger
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
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdValidateOnSaveParams {
  entityName?: string;
  fields?: EntityField[];
  glob?: string;
  debounceMs?: number;
  blocking?: boolean;
  pageName?: string;
  pagePath?: string;
}

// ============================================================================
// Builder
// ============================================================================

export function stdValidateOnSave(params: StdValidateOnSaveParams = {}): OrbitalSchema {
  const {
    entityName = 'ValidationResult',
    glob = '**/*.orb',
    debounceMs = 500,
    blocking = true,
    pageName = 'ValidatorPage',
    pagePath = '/validator',
  } = params;

  // Entity
  const fields: EntityField[] = ensureIdField([
    { name: 'path', type: 'string' as const },
    { name: 'valid', type: 'boolean' as const, default: false },
    { name: 'errors', type: 'array' as const, default: [] },
    { name: 'warnings', type: 'array' as const, default: [] },
    { name: 'timestamp', type: 'number' as const, default: 0 },
    { name: 'status', type: 'string' as const, default: 'idle' },
  ]);

  const entity: Entity = makeEntity({
    name: entityName,
    persistence: 'runtime',
    fields,
  });

  // Header with refresh button (for valid/invalid states)
  const headerWithRefresh = (subtitle: string) => ['render-ui', 'main', {
    type: 'page-header',
    title: 'Orb File Validator',
    subtitle,
    actions: [
      { event: 'REFRESH', label: 'Validate Now', variant: 'primary' },
    ],
  }];

  // Header without refresh (for idle/validating states)
  const headerPlain = (subtitle: string) => ['render-ui', 'main', {
    type: 'page-header',
    title: 'Orb File Validator',
    subtitle,
  }];

  // Trait
  const trait: Trait = {
    name: 'OrbFileWatcher',
    linkedEntity: entityName,
    category: 'interaction' as const,
    listens: [
      {
        event: 'OS_FILE_MODIFIED',
        scope: 'external',
        guard: ['str/endsWith', '@payload.path', '.orb'],
      },
    ],
    emits: [
      {
        event: 'AGENT_INTERRUPT',
        scope: 'external',
        payload: [
          { name: 'type', type: 'string' },
          { name: 'status', type: 'string' },
          { name: 'path', type: 'string' },
          { name: 'errors', type: 'array' },
          { name: 'blocking', type: 'boolean' },
        ],
      },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'validating' },
        { name: 'valid' },
        { name: 'invalid' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'OS_FILE_MODIFIED',
          name: 'File Modified',
          payload: [
            { name: 'path', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'dir', type: 'string' },
            { name: 'ext', type: 'string' },
            { name: 'timestamp', type: 'number' },
          ],
        },
        { key: 'REFRESH', name: 'Validate Now' },
        {
          key: 'VALIDATION_PASSED',
          name: 'Validation Passed',
          payload: [
            { name: 'warnings', type: 'array' },
          ],
        },
        {
          key: 'VALIDATION_FAILED',
          name: 'Validation Failed',
          payload: [
            { name: 'errors', type: 'array' },
            { name: 'warnings', type: 'array' },
          ],
        },
      ],
      transitions: [
        // INIT: register file watcher + show idle UI
        {
          from: 'idle',
          event: 'INIT',
          to: 'idle',
          effects: [
            ['os/watch-files', glob],
            ['os/debounce', debounceMs, 'OS_FILE_MODIFIED'],
            ['set', '@entity.status', 'idle'],
            headerPlain(`Watching ${glob} for changes`),
            ['render-ui', 'center', {
              type: 'empty-state',
              title: 'Waiting for file changes',
              description: `Watching ${glob}. Save an .orb file to trigger validation.`,
            }],
          ],
        },
        // File modified from idle: start validation
        {
          from: 'idle',
          event: 'OS_FILE_MODIFIED',
          to: 'validating',
          effects: [
            ['set', '@entity.path', '@payload.path'],
            ['set', '@entity.timestamp', '@now'],
            ['set', '@entity.status', 'validating'],
            headerPlain('Validating...'),
            ['render-ui', 'center', {
              type: 'loading-state',
              title: 'Running orbital validate...',
            }],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@payload.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
        // Validation passed: show success
        {
          from: 'validating',
          event: 'VALIDATION_PASSED',
          to: 'valid',
          effects: [
            ['set', '@entity.valid', true],
            ['set', '@entity.errors', []],
            ['set', '@entity.warnings', '@payload.warnings'],
            ['set', '@entity.status', 'valid'],
            headerWithRefresh('Validation passed'),
            ['render-ui', 'center', {
              type: 'entity-detail',
              entity: entityName,
              fields: ['path', 'valid', 'status', 'timestamp'],
            }],
            ['notify', 'success', 'Schema is valid'],
            ['emit', 'AGENT_INTERRUPT', {
              type: 'validation',
              status: 'passed',
              path: '@entity.path',
              blocking: false,
            }],
          ],
        },
        // Validation failed: show errors
        {
          from: 'validating',
          event: 'VALIDATION_FAILED',
          to: 'invalid',
          effects: [
            ['set', '@entity.valid', false],
            ['set', '@entity.errors', '@payload.errors'],
            ['set', '@entity.warnings', '@payload.warnings'],
            ['set', '@entity.status', 'invalid'],
            headerWithRefresh('Validation failed'),
            ['render-ui', 'center', {
              type: 'entity-detail',
              entity: entityName,
              fields: ['path', 'valid', 'errors', 'warnings', 'status'],
            }],
            ['notify', 'error', 'Schema has errors'],
            ['emit', 'AGENT_INTERRUPT', {
              type: 'validation',
              status: 'failed',
              path: '@entity.path',
              errors: '@payload.errors',
              blocking,
            }],
          ],
        },
        // Re-validate from valid state
        {
          from: 'valid',
          event: 'OS_FILE_MODIFIED',
          to: 'validating',
          effects: [
            ['set', '@entity.path', '@payload.path'],
            ['set', '@entity.timestamp', '@now'],
            ['set', '@entity.status', 'validating'],
            headerPlain('Re-validating...'),
            ['render-ui', 'center', {
              type: 'loading-state',
              title: 'Running orbital validate...',
            }],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@payload.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
        // Re-validate from invalid state
        {
          from: 'invalid',
          event: 'OS_FILE_MODIFIED',
          to: 'validating',
          effects: [
            ['set', '@entity.path', '@payload.path'],
            ['set', '@entity.timestamp', '@now'],
            ['set', '@entity.status', 'validating'],
            headerPlain('Re-validating...'),
            ['render-ui', 'center', {
              type: 'loading-state',
              title: 'Running orbital validate...',
            }],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@payload.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
        // Manual refresh from any state that has data
        {
          from: 'valid',
          event: 'REFRESH',
          to: 'validating',
          effects: [
            ['set', '@entity.status', 'validating'],
            headerPlain('Re-validating...'),
            ['render-ui', 'center', {
              type: 'loading-state',
              title: 'Running orbital validate...',
            }],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@entity.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
        {
          from: 'invalid',
          event: 'REFRESH',
          to: 'validating',
          effects: [
            ['set', '@entity.status', 'validating'],
            headerPlain('Re-validating...'),
            ['render-ui', 'center', {
              type: 'loading-state',
              title: 'Running orbital validate...',
            }],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@entity.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
      ],
    },
  } as unknown as Trait;

  // Page: status dashboard
  const pages: Page[] = [
    makePage({
      name: pageName,
      path: pagePath,
      traitName: 'OrbFileWatcher',
    }),
  ];

  return makeSchema('ValidateOnSave', makeOrbital('ValidateOnSave', entity, [trait], pages));
}

export default stdValidateOnSave;
