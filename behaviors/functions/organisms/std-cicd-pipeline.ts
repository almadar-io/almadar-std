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
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';
import { stdAsync } from '../atoms/std-async.js';

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
  { name: 'status', type: 'string', required: true },
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
  { name: 'status', type: 'string' },
  { name: 'deployedAt', type: 'string' },
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

  return compose(
    [buildOrbital, stageOrbital, deploymentOrbital],
    pages,
    connections,
    'CI/CD Pipeline',
  );
}
