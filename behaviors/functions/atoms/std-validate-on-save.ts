/**
 * std-validate-on-save
 *
 * OS trigger that watches .orb files and validates them on save.
 * Emits AGENT_INTERRUPT with validation results to interrupt
 * autonomous agents with ground truth.
 *
 * @level atom
 * @family os-trigger
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdValidateOnSaveParams {
  entityName?: string;
  glob?: string;
  debounceMs?: number;
  blocking?: boolean;
}

// ============================================================================
// Builder
// ============================================================================

export function stdValidateOnSave(params: StdValidateOnSaveParams = {}): OrbitalDefinition {
  const {
    entityName = 'ValidationResult',
    glob = '**/*.orb',
    debounceMs = 500,
    blocking = true,
  } = params;

  // Entity
  const fields: EntityField[] = ensureIdField([
    { name: 'path', type: 'string' as const },
    { name: 'valid', type: 'boolean' as const, default: false },
    { name: 'errors', type: 'array' as const, default: [] },
    { name: 'warnings', type: 'array' as const, default: [] },
    { name: 'timestamp', type: 'number' as const, default: 0 },
  ]);

  const entity: Entity = makeEntity({
    name: entityName,
    persistence: 'runtime',
    fields,
  });

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
      { event: 'AGENT_INTERRUPT', scope: 'external' },
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
        { key: 'OS_FILE_MODIFIED', name: 'File Modified' },
        { key: 'VALIDATION_PASSED', name: 'Validation Passed' },
        { key: 'VALIDATION_FAILED', name: 'Validation Failed' },
      ],
      transitions: [
        // INIT: register file watcher
        {
          from: 'idle',
          event: 'INIT',
          to: 'idle',
          effects: [
            ['os/watch-files', glob],
            ['os/debounce', debounceMs, 'OS_FILE_MODIFIED'],
          ],
        },
        // File modified: start validation
        {
          from: 'idle',
          event: 'OS_FILE_MODIFIED',
          to: 'validating',
          effects: [
            ['set', '@entity.path', '@payload.path'],
            ['set', '@entity.timestamp', '@now'],
            ['call-service', 'orbital-cli', 'validate', {
              path: '@payload.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
        // Validation passed
        {
          from: 'validating',
          event: 'VALIDATION_PASSED',
          to: 'valid',
          effects: [
            ['set', '@entity.valid', true],
            ['set', '@entity.errors', []],
            ['set', '@entity.warnings', '@payload.warnings'],
            ['emit', 'AGENT_INTERRUPT', {
              type: 'validation',
              status: 'passed',
              path: '@entity.path',
              blocking: false,
            }],
          ],
        },
        // Validation failed
        {
          from: 'validating',
          event: 'VALIDATION_FAILED',
          to: 'invalid',
          effects: [
            ['set', '@entity.valid', false],
            ['set', '@entity.errors', '@payload.errors'],
            ['set', '@entity.warnings', '@payload.warnings'],
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
            ['call-service', 'orbital-cli', 'validate', {
              path: '@payload.path',
              onSuccess: 'VALIDATION_PASSED',
              onError: 'VALIDATION_FAILED',
            }],
          ],
        },
      ],
    },
  } as unknown as Trait;

  // No pages needed - this is a headless trigger
  const pages: Page[] = [];

  return makeOrbital({
    name: 'ValidateOnSave',
    entity,
    traits: [trait],
    pages,
    emits: ['AGENT_INTERRUPT'],
  });
}

export default stdValidateOnSave;
