/**
 * std-stem-lab
 *
 * STEM lab organism.
 * Composes: stdSimulatorGame(Experiment) + stdClassifierGame(Classification)
 *         + stdDisplay(LabResult)
 *
 * Pages: /simulator (initial), /classifier, /results
 *
 * @level organism
 * @family educational
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdSimulatorGame } from '../molecules/std-simulator-game.js';
import { stdClassifierGame } from '../molecules/std-classifier-game.js';
import { stdDisplay } from '../atoms/std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdStemLabParams {
  experimentFields?: EntityField[];
  classificationFields?: EntityField[];
  labResultFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultExperimentFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'hypothesis', type: 'string' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'completed', type: 'boolean', default: false },
];

const defaultClassificationFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'category', type: 'string' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'accuracy', type: 'number', default: 0 },
];

const defaultLabResultFields: EntityField[] = [
  { name: 'experimentCount', type: 'number', default: 0 },
  { name: 'avgAccuracy', type: 'number', default: 0 },
  { name: 'totalScore', type: 'number', default: 0 },
  { name: 'grade', type: 'string', default: 'N/A' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdStemLab(params: StdStemLabParams): OrbitalSchema {
  const experimentFields = params.experimentFields ?? defaultExperimentFields;
  const classificationFields = params.classificationFields ?? defaultClassificationFields;
  const labResultFields = params.labResultFields ?? defaultLabResultFields;

  const simulatorOrbital = stdSimulatorGame({
    entityName: 'Experiment',
    fields: experimentFields,
    gameTitle: 'Experiment Simulator',
  });

  const classifierOrbital = stdClassifierGame({
    entityName: 'Classification',
    fields: classificationFields,
    gameTitle: 'Classification Lab',
  });

  const resultsOrbital = stdDisplay({
    entityName: 'LabResult',
    fields: labResultFields,
    headerIcon: 'clipboard',
    pageTitle: 'Lab Results',
  });

  const pages: ComposePage[] = [
    { name: 'SimulatorPage', path: '/simulator', traits: ['ExperimentSimulatorGame'], isInitial: true },
    { name: 'ClassifierPage', path: '/classifier', traits: ['ClassificationClassifierGame'] },
    { name: 'ResultsPage', path: '/results', traits: ['LabResultDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [simulatorOrbital, classifierOrbital, resultsOrbital],
    pages,
    connections,
    'STEM Lab',
  );
}
