/**
 * std-project-manager
 *
 * Project management organism. Composes molecules via compose:
 * - stdList(Task): task management with CRUD
 * - stdList(Sprint): sprint management with CRUD
 * - stdDisplay(Burndown): burndown chart dashboard
 *
 * Cross-orbital connections:
 * - ASSIGN_TASK: SprintBrowse -> TaskBrowse
 * - COMPLETE_SPRINT: SprintBrowse -> BurndownDisplay
 *
 * @level organism
 * @family productivity
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdDisplay } from '../atoms/std-display.js';

// ============================================================================
// Params
// ============================================================================

export interface StdProjectManagerParams {
  appName?: string;
  taskFields?: EntityField[];
  sprintFields?: EntityField[];
  burndownFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_TASK_FIELDS: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'assignee', type: 'string' },
  { name: 'priority', type: 'string', default: 'medium' },
  { name: 'status', type: 'string', default: 'todo' },
  { name: 'storyPoints', type: 'number', default: 0 },
  { name: 'dueDate', type: 'string' },
];

const DEFAULT_SPRINT_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'startDate', type: 'string', required: true },
  { name: 'endDate', type: 'string', required: true },
  { name: 'goal', type: 'string' },
  { name: 'status', type: 'string', default: 'planning' },
  { name: 'taskCount', type: 'number', default: 0 },
];

const DEFAULT_BURNDOWN_FIELDS: EntityField[] = [
  { name: 'totalPoints', type: 'number', default: 0 },
  { name: 'completedPoints', type: 'number', default: 0 },
  { name: 'remainingPoints', type: 'number', default: 0 },
  { name: 'velocity', type: 'number', default: 0 },
  { name: 'daysRemaining', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdProjectManager(params: StdProjectManagerParams): OrbitalSchema {
  const taskFields = params.taskFields ?? DEFAULT_TASK_FIELDS;
  const sprintFields = params.sprintFields ?? DEFAULT_SPRINT_FIELDS;
  const burndownFields = params.burndownFields ?? DEFAULT_BURNDOWN_FIELDS;

  const tasks = stdList({
    entityName: 'Task',
    fields: taskFields,
    pageTitle: 'Tasks',
    headerIcon: 'check-square',
    pageName: 'TasksPage',
    pagePath: '/tasks',
    isInitial: true,
  });

  const sprints = stdList({
    entityName: 'Sprint',
    fields: sprintFields,
    pageTitle: 'Sprints',
    headerIcon: 'zap',
    pageName: 'SprintsPage',
    pagePath: '/sprints',
  });

  const burndown = stdDisplay({
    entityName: 'Burndown',
    fields: burndownFields,
    pageTitle: 'Burndown Chart',
    headerIcon: 'trending-down',
    pageName: 'BurndownPage',
    pagePath: '/burndown',
    columns: 5,
    persistence: 'singleton',
  });

  return compose(
    [tasks, sprints, burndown],
    [
      { name: 'TasksPage', path: '/tasks', traits: ['TaskBrowse', 'TaskCreate', 'TaskEdit', 'TaskView', 'TaskDelete'], isInitial: true },
      { name: 'SprintsPage', path: '/sprints', traits: ['SprintBrowse', 'SprintCreate', 'SprintEdit', 'SprintView', 'SprintDelete'] },
      { name: 'BurndownPage', path: '/burndown', traits: ['BurndownDisplay'] },
    ],
    [
      { from: 'SprintBrowse', to: 'TaskBrowse', event: { event: 'ASSIGN_TASK', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'SprintBrowse', to: 'BurndownDisplay', event: { event: 'COMPLETE_SPRINT', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],
    params.appName ?? 'ProjectManagerApp',
  );
}
