/**
 * std-cicd-pipeline
 *
 * CI/CD pipeline organism.
 * Composes: stdList(Build) + stdDisplay(Stage) + stdAsync(Deployment)
 *
 * Pages: /builds (initial), /stages, /deploy
 *
 * @level organism
 * @family devops
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

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';
import { stdAsync } from '../atoms/std-async.js';
import { cicdBuildView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCicdPipelineParams {
  buildFields?: EntityField[];
  stageFields?: EntityField[];
  deploymentFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultBuildFields: EntityField[] = [
  { name: 'branch', type: 'string', required: true },
  { name: 'status', type: 'string', required: true, values: ['pending', 'running', 'success', 'failed'] },
  { name: 'commit', type: 'string' },
  { name: 'triggeredBy', type: 'string' },
];

const defaultStageFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'status', type: 'string', required: true },
  { name: 'duration', type: 'string' },
  { name: 'output', type: 'string' },
];

const defaultDeploymentFields: EntityField[] = [
  { name: 'environment', type: 'string', required: true },
  { name: 'version', type: 'string', required: true },
  { name: 'status', type: 'string', values: ['pending', 'deploying', 'success', 'failed', 'rolled-back'] },
  { name: 'deployedAt', type: 'date' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdCicdPipeline(params: StdCicdPipelineParams): OrbitalSchema {
  const buildFields = params.buildFields ?? defaultBuildFields;
  const stageFields = params.stageFields ?? defaultStageFields;
  const deploymentFields = params.deploymentFields ?? defaultDeploymentFields;

  const buildOrbital = stdList({
    entityName: 'Build',
    fields: buildFields,
    headerIcon: 'package',
    pageTitle: 'Builds',
    emptyTitle: 'No builds yet',
    emptyDescription: 'Trigger a build to get started.',
    ...cicdBuildView(),
  });

  const stageOrbital = stdDisplay({
    entityName: 'Stage',
    fields: stageFields,
    headerIcon: 'layers',
    pageTitle: 'Stages',
  });

  const deploymentOrbital = stdAsync({
    entityName: 'Deployment',
    fields: deploymentFields,
    headerIcon: 'upload-cloud',
    loadingMessage: 'Deploying...',
    successMessage: 'Deployment successful.',
    errorMessage: 'Deployment failed.',
  });

  const pages: ComposePage[] = [
    { name: 'BuildsPage', path: '/builds', traits: ['BuildBrowse', 'BuildCreate', 'BuildEdit', 'BuildView', 'BuildDelete'], isInitial: true },
    { name: 'StagesPage', path: '/stages', traits: ['StageDisplay'] },
    { name: 'DeployPage', path: '/deploy', traits: ['DeploymentAsync'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'CI/CD Pipeline';


  const schema = compose([buildOrbital, stageOrbital, deploymentOrbital], pages, connections, appName);


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
