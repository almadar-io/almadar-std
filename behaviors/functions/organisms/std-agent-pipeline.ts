/**
 * std-agent-pipeline
 *
 * Multi-step pipeline organism. Composes planner + tool-loop molecules with
 * session management, step progress tracking, and a session tree drawer.
 *
 * Composed from:
 * - stdAgentPlanner (molecule): breaks goal into ordered steps
 * - stdAgentToolLoop (molecule): executes steps with tool invocations
 * - stdAgentSession: forks sessions at checkpoints, supports rollback
 * - stdAgentStepProgress: visual pipeline step indicator
 * - stdDrawer: session tree sidebar for navigating branches
 *
 * Cross-trait events:
 * - PIPELINE_PLANNED (Planner -> ToolLoop): plan ready, start execution
 * - STEP_COMPLETE (ToolLoop -> Session): checkpoint after each step
 * - PIPELINE_FINISHED (ToolLoop -> Memory): pipeline done, archive results
 *
 * Pages: /pipeline (initial), /execution, /logs
 *
 * @level organism
 * @family agent
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

import type { OrbitalSchema, OrbitalDefinition, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, extractTrait, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentPlanner } from '../molecules/std-agent-planner.js';
import { stdAgentToolLoop } from '../molecules/std-agent-tool-loop.js';
import { stdAgentSession } from '../atoms/std-agent-session.js';
import { stdAgentStepProgress } from '../atoms/std-agent-step-progress.js';
import { stdDrawer } from '../atoms/std-drawer.js';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentPipelineParams {
  appName?: string;
  pipelineFields?: EntityField[];
  executionFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PIPELINE_FIELDS: EntityField[] = [
  { name: 'goal', type: 'string', default: '' },
  { name: 'steps', type: 'string', default: '[]' },
  { name: 'currentStep', type: 'number', default: 0 },
  { name: 'totalSteps', type: 'number', default: 0 },
  { name: 'status', type: 'string', default: 'idle' },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'error', type: 'string', default: '' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdAgentPipeline(params: StdAgentPipelineParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Agent Pipeline';

  // 1. Planner molecule (classifies, recalls memory, generates plan)
  const plannerOrbital = stdAgentPlanner({
    entityName: 'PipelinePlan',
    persistence: 'runtime',
    pageName: 'PipelinePage',
    pagePath: '/pipeline',
    isInitial: true,
    categories: ['data', 'transform', 'validate', 'deploy', 'test'],
  });
  const plannerDef = plannerOrbital.orbitals[0] as OrbitalDefinition;
  const plannerTrait = (plannerDef.traits as Trait[])[0];
  plannerTrait.name = 'PipelinePlanner';
  plannerTrait.emits = [
    ...(plannerTrait.emits ?? []),
    { event: 'PIPELINE_PLANNED', description: 'Pipeline steps planned, ready for execution', scope: 'internal' },
  ];

  // 2. Tool loop molecule (executes steps with tools)
  const toolLoopOrbital = stdAgentToolLoop({
    entityName: 'PipelineExec',
    fields: params.executionFields,
    persistence: 'runtime',
    pageName: 'ExecutionPage',
    pagePath: '/execution',
    maxIterations: 20,
    compactThreshold: 0.8,
  });
  const toolLoopDef = toolLoopOrbital.orbitals[0] as OrbitalDefinition;
  const toolLoopTrait = (toolLoopDef.traits as Trait[])[0];
  toolLoopTrait.name = 'PipelineExecutor';
  toolLoopTrait.emits = [
    ...(toolLoopTrait.emits ?? []),
    { event: 'STEP_COMPLETE', description: 'Step completed, checkpoint', scope: 'internal' as const, payload: [
      { name: 'step', type: 'number' },
    ]},
    { event: 'PIPELINE_FINISHED', description: 'Pipeline execution done', scope: 'internal' as const },
  ];

  // 3. Session atom (forking and checkpoints)
  const sessionOrbital = stdAgentSession({
    entityName: 'PipelineSession',
    persistence: 'runtime',
    pageName: 'SessionPage',
    pagePath: '/session',
  });
  const sessionDef = sessionOrbital.orbitals[0] as OrbitalDefinition;
  const sessionTrait = (sessionDef.traits as Trait[])[0];
  sessionTrait.name = 'PipelineSessionManager';

  // 4. Memory atom for execution logs
  const memoryOrbital = stdAgentMemory({
    entityName: 'ExecutionLog',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'LogsPage',
    pagePath: '/logs',
  });

  // 5. UI: step progress indicator
  const pipelineFields = ensureIdField(params.pipelineFields ?? DEFAULT_PIPELINE_FIELDS);
  const stepTrait = extractTrait(stdAgentStepProgress({
    entityName: 'PipelineProgress',
    stepLabels: ['Plan', 'Execute', 'Checkpoint', 'Verify', 'Done'],
    persistence: 'runtime',
  }));
  stepTrait.name = 'PipelineStepProgress';
  const stepEntity = makeEntity({
    name: 'PipelineProgress',
    fields: ensureIdField([
      { name: 'steps', type: 'string', default: 'Plan,Execute,Checkpoint,Verify,Done' },
      { name: 'currentStep', type: 'number', default: 0 },
      { name: 'totalSteps', type: 'number', default: 5 },
      { name: 'status', type: 'string', default: 'pending' },
    ]),
    persistence: 'runtime',
  });
  const stepOrbital: OrbitalDefinition = makeOrbital('PipelineProgressOrbital', stepEntity, [stepTrait], [
    makePage({ name: 'PipelineProgressPage', path: '/pipeline/progress', traitName: 'PipelineStepProgress' }),
  ]);

  // 6. UI: drawer for session tree
  const drawerTrait = extractTrait(stdDrawer({
    entityName: 'SessionTree',
    fields: [
      { name: 'branchId', type: 'string', default: '' },
      { name: 'label', type: 'string', default: '' },
      { name: 'status', type: 'string', default: '' },
    ],
    standalone: false,
    drawerTitle: 'Session Tree',
    headerIcon: 'git-branch',
  }));
  drawerTrait.name = 'SessionTreeDrawer';
  const drawerEntity = makeEntity({
    name: 'SessionTree',
    fields: ensureIdField([
      { name: 'branchId', type: 'string', default: '' },
      { name: 'label', type: 'string', default: '' },
      { name: 'status', type: 'string', default: '' },
    ]),
    persistence: 'runtime',
  });
  const drawerOrbital: OrbitalDefinition = makeOrbital('SessionTreeOrbital', drawerEntity, [drawerTrait], [
    makePage({ name: 'SessionTreePage', path: '/pipeline/tree', traitName: 'SessionTreeDrawer' }),
  ]);

  const pages: ComposePage[] = [
    { name: 'PipelinePage', path: '/pipeline', traits: ['PipelinePlanner'], isInitial: true },
    { name: 'ExecutionPage', path: '/execution', traits: ['PipelineExecutor'] },
    { name: 'SessionPage', path: '/session', traits: ['PipelineSessionManager'] },
    { name: 'PipelineProgressPage', path: '/pipeline/progress', traits: ['PipelineStepProgress'] },
    { name: 'SessionTreePage', path: '/pipeline/tree', traits: ['SessionTreeDrawer'] },
    { name: 'LogsPage', path: '/logs', traits: ['ExecutionLogBrowse', 'ExecutionLogCreate', 'ExecutionLogAgent'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'PipelinePlanner',
      to: 'PipelineExecutor',
      event: { event: 'PIPELINE_PLANNED', description: 'Plan ready, start execution', payload: [{ name: 'steps', type: 'string' }] },
      triggers: 'EXECUTE',
    },
    {
      from: 'PipelineExecutor',
      to: 'PipelineSessionManager',
      event: { event: 'STEP_COMPLETE', description: 'Checkpoint after step', payload: [{ name: 'step', type: 'number' }] },
      triggers: 'INIT',
    },
    {
      from: 'PipelineExecutor',
      to: 'ExecutionLogAgent',
      event: { event: 'PIPELINE_FINISHED', description: 'Archive pipeline results', payload: [{ name: 'result', type: 'string' }] },
      triggers: 'MEMORIZE',
    },
  ];

  const schema = compose(
    [plannerOrbital, toolLoopOrbital, sessionOrbital, memoryOrbital, stepOrbital, drawerOrbital],
    pages,
    connections,
    appName,
  );

  const navPages = pages.filter(p => ['/pipeline', '/execution', '/logs'].includes(p.path));
  return wrapInDashboardLayout(schema, appName, buildNavItems(navPages, {
    pipeline: 'git-branch',
    execution: 'play',
    logs: 'terminal',
  }));
}
