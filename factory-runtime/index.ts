/**
 * `@almadar/std/factory-runtime` — pure data-driven equivalents of the
 * per-behavior TS factories that `scripts/regenerate-std-ts.mjs` emits.
 *
 * Used by:
 * - The codegen script itself (manifest computation goes through
 *   `extractManifest`, ensuring single-source-of-truth for the shape).
 * - The team-behavior promotion server: calls `extractManifest` at upload
 *   time and stores `manifests[]` alongside the resolved `.orb`.
 * - The team-behavior dispatch path: calls `applyParamsToOrb` so promoted
 *   behaviors flow through the same overlay as std behaviors.
 *
 * Reference: `docs/Almadar_Studio_SDK.md` §7.4.
 *
 * @packageDocumentation
 */

export { extractManifest } from './extract-manifest.js';
export {
  applyParamsToOrb,
  validateOrbitalFactoryParams,
} from './apply-params-to-orb.js';
export { applyParamsToWholeOrb } from './apply-params-to-whole-orb.js';
export type {
  OrbitalFactoryParams,
  OrbitalTraitOverride,
  ParamValidationError,
  ParamValidationResult,
} from './types.js';
// Re-export the canonical manifest types from their existing home so callers
// have a single import surface.
export type {
  OrbitalParamsManifest,
  ParamFieldDescriptor,
} from '../behaviors/functions/dispatch.js';
