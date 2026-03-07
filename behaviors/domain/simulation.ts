/**
 * Simulation Domain Behaviors
 *
 * Standard behaviors for agent simulations, rule engines,
 * and time-step controls.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-agent-sim - Agent Simulation
// ============================================================================

/**
 * std-agent-sim - Agent-based simulation with tick updates.
 * States: idle -> running -> paused -> completed
 */
export const AGENT_SIM_BEHAVIOR: OrbitalSchema = {
  name: 'std-agent-sim',
  version: '1.0.0',
  description: 'Agent-based simulation with tick-driven updates',
  orbitals: [
    {
      name: 'AgentSimOrbital',
      entity: {
        name: 'SimAgent',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 },
          { name: 'state', type: 'string', default: 'idle' },
          { name: 'energy', type: 'number', default: 100 },
        ],
      },
      traits: [
        {
          name: 'AgentSimControl',
          linkedEntity: 'SimAgent',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'running' },
              { name: 'paused' },
              { name: 'completed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Simulation' },
              { key: 'PAUSE', name: 'Pause Simulation' },
              { key: 'RESUME', name: 'Resume Simulation' },
              { key: 'STOP', name: 'Stop Simulation' },
              { key: 'RESET', name: 'Reset Simulation' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.energy', 100],
                  ['set', '@entity.state', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Agent Simulation' }],
                  ['render-ui', 'main', { type: 'card', title: '@entity.name' }],
                ],
              },
              {
                from: 'idle',
                to: 'running',
                event: 'START',
                effects: [
                  ['set', '@entity.state', 'running'],
                  ['render-ui', 'main', { type: 'stats', label: 'Agent', value: '@entity.id' }],
                ],
              },
              {
                from: 'running',
                to: 'paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.state', 'paused'],
                  ['render-ui', 'main', { type: 'stats', label: 'Agent', value: '@entity.id' }],
                ],
              },
              {
                from: 'paused',
                to: 'running',
                event: 'RESUME',
                effects: [
                  ['set', '@entity.state', 'running'],
                  ['render-ui', 'main', { type: 'stats', label: 'Agent', value: '@entity.id' }],
                ],
              },
              {
                from: 'running',
                to: 'completed',
                event: 'STOP',
                effects: [
                  ['set', '@entity.state', 'completed'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Simulation Complete' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Agent', value: '@entity.id' }],
                ],
              },
              {
                from: 'paused',
                to: 'completed',
                event: 'STOP',
                effects: [
                  ['set', '@entity.state', 'completed'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Simulation Complete' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Agent', value: '@entity.id' }],
                ],
              },
              {
                from: 'completed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.energy', 100],
                  ['set', '@entity.state', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Agent Simulation' }],
                  ['render-ui', 'main', { type: 'card', title: '@entity.name' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'AgentTick',
              interval: 'frame',
              guard: ['=', '@state', 'running'],
              effects: [
                ['set', '@entity.energy', ['-', '@entity.energy', 1]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'SimulationPage',
          path: '/simulation',
          isInitial: true,
          traits: [{ ref: 'AgentSimControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-rule-engine - Rule Management
// ============================================================================

/**
 * std-rule-engine - Rule CRUD for simulation engines.
 * States: browsing -> creating -> editing
 */
export const RULE_ENGINE_BEHAVIOR: OrbitalSchema = {
  name: 'std-rule-engine',
  version: '1.0.0',
  description: 'Rule management for simulation engines',
  orbitals: [
    {
      name: 'RuleEngineOrbital',
      entity: {
        name: 'SimRule',
        persistence: 'persistent',
        collection: 'sim_rules',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'condition', type: 'string', default: '' },
          { name: 'action', type: 'string', default: '' },
          { name: 'priority', type: 'number', default: 0 },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'RuleEngineControl',
          linkedEntity: 'SimRule',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'editing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'New Rule' },
              { key: 'EDIT', name: 'Edit Rule', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'SAVE', name: 'Save Rule', payloadSchema: [{ name: 'name', type: 'string', required: true }, { name: 'condition', type: 'string', required: true }, { name: 'action', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'SimRule'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Simulation Rules', 
                    actions: [{ label: 'Create', event: 'CREATE' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'SimRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'SimRule'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'SimRule',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.condition', '@payload.condition'],
                  ['set', '@entity.action', '@payload.action'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'SimRule'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'SimRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'SimRule'],
                  ['render-ui', 'modal', { type: 'form-section',
                    entity: 'SimRule',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['set', '@entity.name', '@payload.name'],
                  ['set', '@entity.condition', '@payload.condition'],
                  ['set', '@entity.action', '@payload.action'],
                  ['render-ui', 'modal', null],
                  ['fetch', 'SimRule'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'SimRule',
                    itemActions: [
                      { label: 'Edit', event: 'EDIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CLOSE',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'RulesPage',
          path: '/rules',
          isInitial: true,
          traits: [{ ref: 'RuleEngineControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-time-step - Time Control
// ============================================================================

/**
 * std-time-step - Time-step control for simulations.
 * States: idle -> running -> paused -> completed
 */
export const TIME_STEP_BEHAVIOR: OrbitalSchema = {
  name: 'std-time-step',
  version: '1.0.0',
  description: 'Time-step control for simulations with tick increment',
  orbitals: [
    {
      name: 'TimeStepOrbital',
      entity: {
        name: 'TimeStepState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'step', type: 'number', default: 0 },
          { name: 'maxSteps', type: 'number', default: 1000 },
          { name: 'speed', type: 'number', default: 1 },
          { name: 'isRunning', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'TimeStepControl',
          linkedEntity: 'TimeStepState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'running' },
              { name: 'paused' },
              { name: 'completed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start' },
              { key: 'PAUSE', name: 'Pause' },
              { key: 'RESUME', name: 'Resume' },
              { key: 'STOP', name: 'Stop' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.step', 0],
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Time Control' }],
                  ['render-ui', 'main', { type: 'card', title: 'Time Control' }],
                ],
              },
              {
                from: 'idle',
                to: 'running',
                event: 'START',
                effects: [
                  ['set', '@entity.isRunning', true],
                  ['set', '@entity.step', 0],
                  ['render-ui', 'main', { type: 'progress-bar', value: 0, label: 'Progress' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Step', value: '@entity.id' }],
                ],
              },
              {
                from: 'running',
                to: 'paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'stats', label: 'Step', value: '@entity.id' }],
                ],
              },
              {
                from: 'paused',
                to: 'running',
                event: 'RESUME',
                effects: [
                  ['set', '@entity.isRunning', true],
                  ['render-ui', 'main', { type: 'stats', label: 'Step', value: '@entity.id' }],
                ],
              },
              {
                from: 'running',
                to: 'completed',
                event: 'STOP',
                effects: [
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Simulation Done' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Step', value: '@entity.id' }],
                ],
              },
              {
                from: 'paused',
                to: 'completed',
                event: 'STOP',
                effects: [
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Simulation Done' }],
                  ['render-ui', 'main', { type: 'stats', label: 'Step', value: '@entity.id' }],
                ],
              },
              {
                from: 'completed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.step', 0],
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Time Control' }],
                  ['render-ui', 'main', { type: 'card', title: 'Time Control' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'StepTick',
              interval: 'frame',
              guard: ['=', '@state', 'running'],
              effects: [
                ['set', '@entity.step', ['+', '@entity.step', 1]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'TimeStepPage',
          path: '/time-step',
          isInitial: true,
          traits: [{ ref: 'TimeStepControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Simulation Behaviors
// ============================================================================

export const SIMULATION_BEHAVIORS: OrbitalSchema[] = [
  AGENT_SIM_BEHAVIOR,
  RULE_ENGINE_BEHAVIOR,
  TIME_STEP_BEHAVIOR,
];
