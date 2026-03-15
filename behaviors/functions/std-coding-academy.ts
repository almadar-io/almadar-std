/**
 * std-coding-academy
 *
 * Coding academy organism.
 * Composes: stdSequencerGame(SeqChallenge) + stdBuilderGame(BuildChallenge)
 *         + stdEventHandlerGame(EventChallenge) + stdDisplay(StudentProgress)
 *
 * Pages: /sequencer (initial), /builder, /events, /progress
 *
 * @level organism
 * @family educational
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdSequencerGame } from './std-sequencer-game.js';
import { stdBuilderGame } from './std-builder-game.js';
import { stdEventHandlerGame } from './std-event-handler-game.js';
import { stdDisplay } from './std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCodingAcademyParams {
  seqChallengeFields?: EntityField[];
  buildChallengeFields?: EntityField[];
  eventChallengeFields?: EntityField[];
  studentProgressFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultSeqChallengeFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'difficulty', type: 'string', default: 'easy' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'completed', type: 'boolean', default: false },
];

const defaultBuildChallengeFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'difficulty', type: 'string', default: 'easy' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'completed', type: 'boolean', default: false },
];

const defaultEventChallengeFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'difficulty', type: 'string', default: 'easy' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'completed', type: 'boolean', default: false },
];

const defaultStudentProgressFields: EntityField[] = [
  { name: 'totalLessons', type: 'number', default: 0 },
  { name: 'completedLessons', type: 'number', default: 0 },
  { name: 'averageScore', type: 'number', default: 0 },
  { name: 'streak', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdCodingAcademy(params: StdCodingAcademyParams): OrbitalSchema {
  const seqChallengeFields = params.seqChallengeFields ?? defaultSeqChallengeFields;
  const buildChallengeFields = params.buildChallengeFields ?? defaultBuildChallengeFields;
  const eventChallengeFields = params.eventChallengeFields ?? defaultEventChallengeFields;
  const studentProgressFields = params.studentProgressFields ?? defaultStudentProgressFields;

  const sequencerOrbital = stdSequencerGame({
    entityName: 'SeqChallenge',
    fields: seqChallengeFields,
    gameTitle: 'Sequencer Challenge',
  });

  const builderOrbital = stdBuilderGame({
    entityName: 'BuildChallenge',
    fields: buildChallengeFields,
    gameTitle: 'Builder Challenge',
  });

  const eventHandlerOrbital = stdEventHandlerGame({
    entityName: 'EventChallenge',
    fields: eventChallengeFields,
    gameTitle: 'Event Handler Challenge',
  });

  const progressOrbital = stdDisplay({
    entityName: 'StudentProgress',
    fields: studentProgressFields,
    headerIcon: 'trending-up',
    pageTitle: 'Progress',
  });

  const pages: ComposePage[] = [
    { name: 'SequencerPage', path: '/sequencer', traits: ['SeqChallengeSequencerGame'], isInitial: true },
    { name: 'BuilderPage', path: '/builder', traits: ['BuildChallengeBuilderGame'] },
    { name: 'EventsPage', path: '/events', traits: ['EventChallengeEventHandlerGame'] },
    { name: 'ProgressPage', path: '/progress', traits: ['StudentProgressDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [sequencerOrbital, builderOrbital, eventHandlerOrbital, progressOrbital],
    pages,
    connections,
    'Coding Academy',
  );
}
