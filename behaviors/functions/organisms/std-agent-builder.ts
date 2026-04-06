/**
 * std-agent-builder
 *
 * Schema builder agent organism. Full build cycle that plans, generates,
 * validates, and fixes .orb programs. Composes planner + tool-loop +
 * fix-loop molecules with session management and tabbed views.
 *
 * Composed from:
 * - stdAgentPlanner (molecule): task planning with classification and memory
 * - stdAgentToolLoop (molecule): iterative tool execution
 * - stdAgentFixLoop (molecule): validation-fix cycle
 * - stdAgentSession: session forking and checkpointing
 * - stdTabs: Plan / Build / Validate / Fix tab navigation
 * - stdAgentStepProgress: overall build pipeline progress indicator
 *
 * Cross-trait events:
 * - PLAN_READY (Planner -> ToolLoop): plan complete, begin building
 * - TOOL_LOOP_DONE (ToolLoop -> FixLoop): schema generated, validate it
 * - FIX_SUCCEEDED (FixLoop -> Memory): record successful fix pattern
 *
 * Pages: /plan (initial), /build, /validate, /fix
 *
 * @level organism
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalSchema, OrbitalDefinition, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, extractTrait, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentPlanner } from '../molecules/std-agent-planner.js';
import { stdAgentToolLoop } from '../molecules/std-agent-tool-loop.js';
import { stdAgentFixLoop } from '../molecules/std-agent-fix-loop.js';
import { stdAgentSession } from '../atoms/std-agent-session.js';
import { stdTabs } from '../atoms/std-tabs.js';
import { stdAgentStepProgress } from '../atoms/std-agent-step-progress.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentBuilderParams {
  appName?: string;
  taskFields?: EntityField[];
  fixFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_TASK_FIELDS: EntityField[] = [
  { name: 'prompt', type: 'string', default: '' },
  { name: 'plan', type: 'string', default: '' },
  { name: 'schema', type: 'string', default: '' },
  { name: 'validationStatus', type: 'string', default: 'pending' },
  { name: 'buildPhase', type: 'string', default: 'idle' },
  { name: 'attempts', type: 'number', default: 0 },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'error', type: 'string', default: '' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdAgentBuilder(params: StdAgentBuilderParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Schema Builder';

  // 1. Planner molecule (classifies task, recalls memory, generates plan)
  const plannerOrbital = stdAgentPlanner({
    entityName: 'BuildPlan',
    persistence: 'runtime',
    pageName: 'PlanPage',
    pagePath: '/plan',
    isInitial: true,
    categories: ['schema', 'component', 'trait', 'page', 'behavior'],
  });
  const plannerTrait = (plannerOrbital.traits as Trait[])[0];
  plannerTrait.name = 'BuildPlanner';

  // 2. Tool loop molecule (executes build steps with tools)
  const toolLoopOrbital = stdAgentToolLoop({
    entityName: 'BuildLoop',
    persistence: 'runtime',
    pageName: 'BuildPage',
    pagePath: '/build',
    maxIterations: 10,
    compactThreshold: 0.8,
  });
  const toolLoopTrait = (toolLoopOrbital.traits as Trait[])[0];
  toolLoopTrait.name = 'SchemaBuilder';

  // 3. Fix loop molecule (validates and fixes schema)
  const fixLoopOrbital = stdAgentFixLoop({
    entityName: 'BuildFix',
    fields: params.fixFields,
    persistence: 'runtime',
    pageName: 'FixPage',
    pagePath: '/fix',
    maxAttempts: 5,
    validateTool: 'validate-schema',
    fixTool: 'apply-fix',
  });
  const fixLoopTrait = (fixLoopOrbital.traits as Trait[])[0];
  fixLoopTrait.name = 'FixLoop';

  // 4. Session atom (forking and checkpoints)
  const sessionOrbital = stdAgentSession({
    entityName: 'BuildSession',
    persistence: 'runtime',
    pageName: 'SessionPage',
    pagePath: '/session',
  });
  const sessionTrait = (sessionOrbital.traits as Trait[])[0];
  sessionTrait.name = 'BuildSessionManager';

  // 5. UI: tabs for Plan / Build / Validate / Fix navigation
  const taskFields = ensureIdField(params.taskFields ?? DEFAULT_TASK_FIELDS);
  const tabsTrait = extractTrait(stdTabs({
    entityName: 'BuildTask',
    fields: taskFields,
    tabItems: [
      { label: 'Plan', value: 'plan' },
      { label: 'Build', value: 'build' },
      { label: 'Validate', value: 'validate' },
      { label: 'Fix', value: 'fix' },
    ],
    headerIcon: 'hammer',
    pageTitle: 'Schema Builder',
  }));
  tabsTrait.name = 'BuilderTabs';
  const tabsEntity = makeEntity({ name: 'BuildTask', fields: taskFields, persistence: 'runtime' });
  const tabsOrbital: OrbitalDefinition = makeOrbital('BuildTaskOrbital', tabsEntity, [tabsTrait], [
    makePage({ name: 'BuilderNavPage', path: '/builder/nav', traitName: 'BuilderTabs' }),
  ]);

  // 6. UI: overall pipeline step progress
  const stepTrait = extractTrait(stdAgentStepProgress({
    entityName: 'BuildProgress',
    stepLabels: ['Plan', 'Generate', 'Validate', 'Fix', 'Done'],
    persistence: 'runtime',
  }));
  stepTrait.name = 'BuildStepProgress';
  const stepEntity = makeEntity({
    name: 'BuildProgress',
    fields: ensureIdField([
      { name: 'steps', type: 'string', default: 'Plan,Generate,Validate,Fix,Done' },
      { name: 'currentStep', type: 'number', default: 0 },
      { name: 'totalSteps', type: 'number', default: 5 },
      { name: 'status', type: 'string', default: 'pending' },
    ]),
    persistence: 'runtime',
  });
  const stepOrbital: OrbitalDefinition = makeOrbital('BuildProgressOrbital', stepEntity, [stepTrait], [
    makePage({ name: 'BuilderProgressPage', path: '/builder/progress', traitName: 'BuildStepProgress' }),
  ]);

  const pages: ComposePage[] = [
    { name: 'PlanPage', path: '/plan', traits: ['BuildPlanner'], isInitial: true },
    { name: 'BuildPage', path: '/build', traits: ['SchemaBuilder'] },
    { name: 'SessionPage', path: '/session', traits: ['BuildSessionManager'] },
    { name: 'FixPage', path: '/fix', traits: ['FixLoop'] },
    { name: 'BuilderNavPage', path: '/builder/nav', traits: ['BuilderTabs'] },
    { name: 'BuilderProgressPage', path: '/builder/progress', traits: ['BuildStepProgress'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'BuildPlanner',
      to: 'SchemaBuilder',
      event: { event: 'PLAN_READY', description: 'Plan complete, begin building', payload: [{ name: 'plan', type: 'string' }] },
      triggers: 'EXECUTE',
    },
    {
      from: 'SchemaBuilder',
      to: 'FixLoop',
      event: { event: 'TOOL_LOOP_DONE', description: 'Schema generated, validate it', payload: [{ name: 'schema', type: 'string' }] },
      triggers: 'FIX',
    },
  ];

  const schema = compose(
    [plannerOrbital, toolLoopOrbital, fixLoopOrbital, sessionOrbital, tabsOrbital, stepOrbital],
    pages,
    connections,
    appName,
  );

  const navPages = pages.filter(p => ['/plan', '/build', '/fix'].includes(p.path));
  return wrapInDashboardLayout(schema, appName, buildNavItems(navPages, {
    plan: 'clipboard-list',
    build: 'hammer',
    fix: 'wrench',
  }));
}
