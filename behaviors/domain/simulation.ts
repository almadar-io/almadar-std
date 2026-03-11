/**
 * Simulation Domain Behaviors
 *
 * Standard behaviors for agent simulations, rule engines,
 * and time-step controls.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from '../types.js';

// ── Shared Simulation Theme ────────────────────────────────────────

const SIMULATION_THEME = {
  name: 'simulation-lime',
  tokens: {
    colors: {
      primary: '#65a30d',
      'primary-hover': '#4d7c0f',
      'primary-foreground': '#ffffff',
      accent: '#84cc16',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-agent-sim - Agent Simulation
// ============================================================================

// ── Reusable main-view effects (agent sim: idle/reset) ─────────────

const agentSimIdleMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: cpu icon + title + start button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'cpu', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Agent Simulation' },
      ]},
      { type: 'button', label: 'Start', icon: 'play', variant: 'primary', action: 'START' },
    ]},
    { type: 'divider' },
    // Agent identity
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Agent', value: '@entity.name', icon: 'cpu' },
      { type: 'stats', label: 'Status', value: '@entity.state', icon: 'activity' },
    ]},
    { type: 'divider' },
    // Position and energy
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'X', value: '@entity.x', icon: 'move' },
      { type: 'stats', label: 'Y', value: '@entity.y', icon: 'move' },
      { type: 'stats', label: 'Energy', value: '@entity.energy', icon: 'zap' },
    ]},
    // Energy meter
    { type: 'meter', value: '@entity.energy', max: 100, label: 'Energy', icon: 'zap' },
  ]},
] as const;

// ── Reusable main-view effects (agent sim: running) ────────────────

const agentSimRunningMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: running indicator + pause/stop controls
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'activity', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Simulation Running' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Pause', icon: 'pause', variant: 'secondary', action: 'PAUSE' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'danger', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    // Live stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Agent', value: '@entity.name', icon: 'cpu' },
      { type: 'badge', label: 'Running', variant: 'success' },
    ]},
    { type: 'divider' },
    // Position and energy readout
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'X', value: '@entity.x', icon: 'move' },
      { type: 'stats', label: 'Y', value: '@entity.y', icon: 'move' },
      { type: 'stats', label: 'Energy', value: '@entity.energy', icon: 'zap' },
    ]},
    // Energy meter (drains over time)
    { type: 'meter', value: '@entity.energy', max: 100, label: 'Energy Remaining', icon: 'zap' },
  ]},
] as const;

// ── Reusable main-view effects (agent sim: paused) ─────────────────

const agentSimPausedMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: paused indicator + resume/stop controls
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'pause', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Simulation Paused' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Resume', icon: 'play', variant: 'primary', action: 'RESUME' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'danger', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    // Status
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Agent', value: '@entity.name', icon: 'cpu' },
      { type: 'badge', label: 'Paused', variant: 'warning' },
    ]},
    { type: 'divider' },
    // Frozen stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'X', value: '@entity.x', icon: 'move' },
      { type: 'stats', label: 'Y', value: '@entity.y', icon: 'move' },
      { type: 'stats', label: 'Energy', value: '@entity.energy', icon: 'zap' },
    ]},
    { type: 'meter', value: '@entity.energy', max: 100, label: 'Energy Remaining', icon: 'zap' },
  ]},
] as const;

// ── Reusable main-view effects (agent sim: completed) ──────────────

const agentSimCompletedMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: completed + reset
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bar-chart-2', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Simulation Complete' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'primary', action: 'RESET' },
    ]},
    { type: 'divider' },
    // Final results
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Agent', value: '@entity.name', icon: 'cpu' },
      { type: 'badge', label: 'Completed', variant: 'default' },
    ]},
    { type: 'divider' },
    // Final position and energy
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Final X', value: '@entity.x', icon: 'move' },
      { type: 'stats', label: 'Final Y', value: '@entity.y', icon: 'move' },
      { type: 'stats', label: 'Final Energy', value: '@entity.energy', icon: 'zap' },
    ]},
    { type: 'meter', value: '@entity.energy', max: 100, label: 'Final Energy', icon: 'zap' },
  ]},
] as const;

/**
 * std-agent-sim - Agent-based simulation with tick updates.
 * States: idle -> running -> paused -> completed
 */
export const AGENT_SIM_BEHAVIOR: BehaviorSchema = {
  name: "std-agent-sim",
  version: "1.0.0",
  description: "Agent-based simulation with tick-driven updates",
  theme: {
    name: "simulation-lime",
    tokens: {
      colors: {
        primary: "#65a30d",
        "primary-hover": "#4d7c0f",
        "primary-foreground": "#ffffff",
        accent: "#84cc16",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "AgentSimOrbital",
      entity: {
        name: "SimAgent",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "x",
            type: "number",
            default: 0,
          },
          {
            name: "y",
            type: "number",
            default: 0,
          },
          {
            name: "state",
            type: "string",
            default: "idle",
          },
          {
            name: "energy",
            type: "number",
            default: 100,
          },
        ],
      },
      traits: [
        {
          name: "AgentSimControl",
          linkedEntity: "SimAgent",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "running",
              },
              {
                name: "paused",
              },
              {
                name: "completed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START",
                name: "Start Simulation",
              },
              {
                key: "PAUSE",
                name: "Pause Simulation",
              },
              {
                key: "RESUME",
                name: "Resume Simulation",
              },
              {
                key: "STOP",
                name: "Stop Simulation",
              },
              {
                key: "RESET",
                name: "Reset Simulation",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.x", 0],
                  ["set", "@entity.y", 0],
                  ["set", "@entity.energy", 100],
                  ["set", "@entity.state", "idle"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "cpu",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Agent Simulation",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.state",
                              icon: "activity",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Energy",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "idle",
                to: "running",
                event: "START",
                effects: [
                  ["set", "@entity.state", "running"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Running",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Pause",
                                  icon: "pause",
                                  variant: "secondary",
                                  event: "PAUSE",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Energy Remaining",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "running",
                to: "paused",
                event: "PAUSE",
                effects: [
                  ["set", "@entity.state", "paused"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "pause",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Paused",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Resume",
                                  icon: "play",
                                  variant: "primary",
                                  event: "RESUME",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "badge",
                              label: "Paused",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Energy Remaining",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "paused",
                to: "running",
                event: "RESUME",
                effects: [
                  ["set", "@entity.state", "running"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Running",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Pause",
                                  icon: "pause",
                                  variant: "secondary",
                                  event: "PAUSE",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Energy Remaining",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "running",
                to: "completed",
                event: "STOP",
                effects: [
                  ["set", "@entity.state", "completed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Complete",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESET",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "badge",
                              label: "Completed",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Final X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Final Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Final Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Final Energy",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "paused",
                to: "completed",
                event: "STOP",
                effects: [
                  ["set", "@entity.state", "completed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Complete",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESET",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "badge",
                              label: "Completed",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Final X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Final Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Final Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Final Energy",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "completed",
                to: "idle",
                event: "RESET",
                effects: [
                  ["set", "@entity.x", 0],
                  ["set", "@entity.y", 0],
                  ["set", "@entity.energy", 100],
                  ["set", "@entity.state", "idle"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "cpu",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Agent Simulation",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Agent",
                              value: "@entity.name",
                              icon: "cpu",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.state",
                              icon: "activity",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "X",
                              value: "@entity.x",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Y",
                              value: "@entity.y",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Energy",
                              value: "@entity.energy",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.energy",
                          max: 100,
                          label: "Energy",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "AgentTick",
              interval: "frame",
              guard: ["=", "@state", "running"],
              effects: [
                [
                  "set",
                  "@entity.energy",
                  ["-", "@entity.energy", 1],
                ],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: "SimulationPage",
          path: "/simulation",
          isInitial: true,
          traits: [
            {
              ref: "AgentSimControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-rule-engine - Rule Management
// ============================================================================

// ── Reusable main-view effects (rule engine: browsing) ─────────────

const ruleEngineBrowsingMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: settings icon + title + create button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'settings', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Simulation Rules' },
      ]},
      { type: 'button', label: 'Create', icon: 'plus', variant: 'primary', action: 'CREATE' },
    ]},
    { type: 'divider' },
    // Search
    { type: 'search-input', placeholder: 'Search rules...', icon: 'search' },
    // Rules data list
    { type: 'data-list', entity: 'SimRule',
      fields: [
        { name: 'name', label: 'Rule', icon: 'tag', variant: 'h4' },
        { name: 'condition', label: 'Condition', icon: 'git-branch', variant: 'body' },
        { name: 'action', label: 'Action', icon: 'zap', variant: 'body' },
        { name: 'priority', label: 'Priority', icon: 'bar-chart-2', variant: 'badge', format: 'number' },
        { name: 'isActive', label: 'Active', icon: 'check-circle', variant: 'badge' },
      ],
      itemActions: [
        { label: 'Edit', event: 'EDIT', icon: 'edit' },
      ],
    },
  ]},
] as const;

// ── Reusable modal effects (rule engine: form) ─────────────────────

const ruleEngineFormModalEffect = [
  'render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Modal header
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'edit', size: 'md' },
      { type: 'typography', variant: 'h3', content: 'Rule Editor' },
    ]},
    { type: 'divider' },
    // Form
    { type: 'form-section',
      entity: 'SimRule',
      submitEvent: 'SAVE',
      cancelEvent: 'CANCEL',
    },
  ]},
] as const;

/**
 * std-rule-engine - Rule CRUD for simulation engines.
 * States: browsing -> creating -> editing
 */
export const RULE_ENGINE_BEHAVIOR: BehaviorSchema = {
  name: "std-rule-engine",
  version: "1.0.0",
  description: "Rule management for simulation engines",
  theme: {
    name: "simulation-lime",
    tokens: {
      colors: {
        primary: "#65a30d",
        "primary-hover": "#4d7c0f",
        "primary-foreground": "#ffffff",
        accent: "#84cc16",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "RuleEngineOrbital",
      entity: {
        name: "SimRule",
        persistence: "persistent",
        collection: "sim_rules",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "name",
            type: "string",
            default: "",
          },
          {
            name: "condition",
            type: "string",
            default: "",
          },
          {
            name: "action",
            type: "string",
            default: "",
          },
          {
            name: "priority",
            type: "number",
            default: 0,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
        ],
      },
      traits: [
        {
          name: "RuleEngineControl",
          linkedEntity: "SimRule",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
              },
              {
                name: "editing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "CREATE",
                name: "New Rule",
              },
              {
                key: "EDIT",
                name: "Edit Rule",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "SAVE",
                name: "Save Rule",
                payloadSchema: [
                  {
                    name: "name",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "condition",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "action",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "SimRule"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "settings",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search rules...",
                          icon: "search",
                        },
                        {
                          type: "data-list",
                          entity: "SimRule",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "settings",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "settings",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.condition",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "SimRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "edit",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Rule Editor",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "SimRule",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "condition",
                              type: "string",
                            },
                            {
                              name: "action",
                              type: "string",
                            },
                            {
                              name: "priority",
                              type: "number",
                            },
                            {
                              name: "isActive",
                              type: "boolean",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.condition", "@payload.condition"],
                  ["set", "@entity.action", "@payload.action"],
                  ["render-ui", "modal", null],
                  ["fetch", "SimRule"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "settings",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search rules...",
                          icon: "search",
                        },
                        {
                          type: "data-list",
                          entity: "SimRule",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "settings",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "settings",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.condition",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "editing",
                event: "EDIT",
                effects: [
                  ["fetch", "SimRule"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "edit",
                              size: "md",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Rule Editor",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "SimRule",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "name",
                              type: "string",
                            },
                            {
                              name: "condition",
                              type: "string",
                            },
                            {
                              name: "action",
                              type: "string",
                            },
                            {
                              name: "priority",
                              type: "number",
                            },
                            {
                              name: "isActive",
                              type: "boolean",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.name", "@payload.name"],
                  ["set", "@entity.condition", "@payload.condition"],
                  ["set", "@entity.action", "@payload.action"],
                  ["render-ui", "modal", null],
                  ["fetch", "SimRule"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "settings",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Rules",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Create",
                              icon: "plus",
                              variant: "primary",
                              event: "CREATE",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "search-input",
                          placeholder: "Search rules...",
                          icon: "search",
                        },
                        {
                          type: "data-list",
                          entity: "SimRule",
                          itemActions: [
                            {
                              label: "Edit",
                              event: "EDIT",
                              icon: "edit",
                            },
                          ],
                          emptyIcon: "settings",
                          emptyTitle: "No items yet",
                          emptyDescription: "Items will appear here when available.",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "settings",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.name",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.condition",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.priority",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "editing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "RulesPage",
          path: "/rules",
          isInitial: true,
          traits: [
            {
              ref: "RuleEngineControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-time-step - Time Control
// ============================================================================

// ── Reusable main-view effects (time step: idle/reset) ─────────────

const timeStepIdleMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: clock icon + title + start button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'cpu', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Time Control' },
      ]},
      { type: 'button', label: 'Start', icon: 'play', variant: 'primary', action: 'START' },
    ]},
    { type: 'divider' },
    // Config stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Current Step', value: '@entity.step', icon: 'hash' },
      { type: 'stats', label: 'Max Steps', value: '@entity.maxSteps', icon: 'bar-chart-2' },
      { type: 'stats', label: 'Speed', value: '@entity.speed', icon: 'zap' },
    ]},
    { type: 'divider' },
    // Progress bar at zero
    { type: 'progress-bar', value: 0, label: 'Progress' },
  ]},
] as const;

// ── Reusable main-view effects (time step: running) ────────────────

const timeStepRunningMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: activity icon + title + pause/stop
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'activity', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Running' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Pause', icon: 'pause', variant: 'secondary', action: 'PAUSE' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'danger', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    // Live stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Step', value: '@entity.step', icon: 'hash' },
      { type: 'stats', label: 'Max', value: '@entity.maxSteps', icon: 'bar-chart-2' },
      { type: 'stats', label: 'Speed', value: '@entity.speed', icon: 'zap' },
      { type: 'badge', label: 'Running', variant: 'success' },
    ]},
    { type: 'divider' },
    // Progress bar
    { type: 'progress-bar', value: '@entity.step', max: '@entity.maxSteps', label: 'Simulation Progress' },
    // Line chart for step progression
    { type: 'line-chart', label: 'Step Over Time', entity: 'TimeStepState', field: 'step' },
  ]},
] as const;

// ── Reusable main-view effects (time step: paused) ─────────────────

const timeStepPausedMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: paused + resume/stop
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'pause', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Paused' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Resume', icon: 'play', variant: 'primary', action: 'RESUME' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'danger', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    // Stats with paused badge
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Step', value: '@entity.step', icon: 'hash' },
      { type: 'stats', label: 'Max', value: '@entity.maxSteps', icon: 'bar-chart-2' },
      { type: 'badge', label: 'Paused', variant: 'warning' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.step', max: '@entity.maxSteps', label: 'Simulation Progress' },
  ]},
] as const;

// ── Reusable main-view effects (time step: completed) ──────────────

const timeStepCompletedMainEffect = [
  'render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: completed + reset
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bar-chart-2', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Simulation Done' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'primary', action: 'RESET' },
    ]},
    { type: 'divider' },
    // Final stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total Steps', value: '@entity.step', icon: 'hash' },
      { type: 'stats', label: 'Max Steps', value: '@entity.maxSteps', icon: 'bar-chart-2' },
      { type: 'badge', label: 'Completed', variant: 'default' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.step', max: '@entity.maxSteps', label: 'Final Progress' },
  ]},
] as const;

/**
 * std-time-step - Time-step control for simulations.
 * States: idle -> running -> paused -> completed
 */
export const TIME_STEP_BEHAVIOR: BehaviorSchema = {
  name: "std-time-step",
  version: "1.0.0",
  description: "Time-step control for simulations with tick increment",
  theme: {
    name: "simulation-lime",
    tokens: {
      colors: {
        primary: "#65a30d",
        "primary-hover": "#4d7c0f",
        "primary-foreground": "#ffffff",
        accent: "#84cc16",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "TimeStepOrbital",
      entity: {
        name: "TimeStepState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "step",
            type: "number",
            default: 0,
          },
          {
            name: "maxSteps",
            type: "number",
            default: 1000,
          },
          {
            name: "speed",
            type: "number",
            default: 1,
          },
          {
            name: "isRunning",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "TimeStepControl",
          linkedEntity: "TimeStepState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "running",
              },
              {
                name: "paused",
              },
              {
                name: "completed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START",
                name: "Start",
              },
              {
                key: "PAUSE",
                name: "Pause",
              },
              {
                key: "RESUME",
                name: "Resume",
              },
              {
                key: "STOP",
                name: "Stop",
              },
              {
                key: "RESET",
                name: "Reset",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.step", 0],
                  ["set", "@entity.isRunning", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "cpu",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Time Control",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max Steps",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "stat-display",
                              label: "Speed",
                              value: "@entity.speed",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Progress",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "idle",
                to: "running",
                event: "START",
                effects: [
                  ["set", "@entity.isRunning", true],
                  ["set", "@entity.step", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Running",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Pause",
                                  icon: "pause",
                                  variant: "secondary",
                                  event: "PAUSE",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Step",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "stat-display",
                              label: "Speed",
                              value: "@entity.speed",
                              icon: "zap",
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.step",
                          max: "@entity.maxSteps",
                          label: "Simulation Progress",
                        },
                        {
                          type: "line-chart",
                          label: "Step Over Time",
                          entity: "TimeStepState",
                          field: "step",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "running",
                to: "paused",
                event: "PAUSE",
                effects: [
                  ["set", "@entity.isRunning", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "pause",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Paused",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Resume",
                                  icon: "play",
                                  variant: "primary",
                                  event: "RESUME",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Step",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "badge",
                              label: "Paused",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.step",
                          max: "@entity.maxSteps",
                          label: "Simulation Progress",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "paused",
                to: "running",
                event: "RESUME",
                effects: [
                  ["set", "@entity.isRunning", true],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Running",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "button",
                                  label: "Pause",
                                  icon: "pause",
                                  variant: "secondary",
                                  event: "PAUSE",
                                },
                                {
                                  type: "button",
                                  label: "Stop",
                                  icon: "square",
                                  variant: "danger",
                                  event: "STOP",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Step",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "stat-display",
                              label: "Speed",
                              value: "@entity.speed",
                              icon: "zap",
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.step",
                          max: "@entity.maxSteps",
                          label: "Simulation Progress",
                        },
                        {
                          type: "line-chart",
                          label: "Step Over Time",
                          entity: "TimeStepState",
                          field: "step",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "running",
                to: "completed",
                event: "STOP",
                effects: [
                  ["set", "@entity.isRunning", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Done",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESET",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max Steps",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "badge",
                              label: "Completed",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.step",
                          max: "@entity.maxSteps",
                          label: "Final Progress",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "paused",
                to: "completed",
                event: "STOP",
                effects: [
                  ["set", "@entity.isRunning", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-2",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Simulation Done",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESET",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max Steps",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "badge",
                              label: "Completed",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.step",
                          max: "@entity.maxSteps",
                          label: "Final Progress",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "completed",
                to: "idle",
                event: "RESET",
                effects: [
                  ["set", "@entity.step", 0],
                  ["set", "@entity.isRunning", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "cpu",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Time Control",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.step",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Max Steps",
                              value: "@entity.maxSteps",
                              icon: "bar-chart-2",
                            },
                            {
                              type: "stat-display",
                              label: "Speed",
                              value: "@entity.speed",
                              icon: "zap",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          label: "Progress",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "StepTick",
              interval: "frame",
              guard: ["=", "@state", "running"],
              effects: [
                [
                  "set",
                  "@entity.step",
                  ["+", "@entity.step", 1],
                ],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: "TimeStepPage",
          path: "/time-step",
          isInitial: true,
          traits: [
            {
              ref: "TimeStepControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Simulation Behaviors
// ============================================================================

export const SIMULATION_BEHAVIORS: BehaviorSchema[] = [
  AGENT_SIM_BEHAVIOR,
  RULE_ENGINE_BEHAVIOR,
  TIME_STEP_BEHAVIOR,
];
