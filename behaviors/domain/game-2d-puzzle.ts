/**
 * 2D Puzzle Game Behaviors
 *
 * Standard behaviors for 2D puzzle games: grid puzzles, timers,
 * and combo scoring chains.
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

// ── Shared Puzzle Theme ─────────────────────────────────────────────

const PUZZLE_THEME = {
  name: 'game-puzzle-yellow',
  tokens: {
    colors: {
      primary: '#ca8a04',
      'primary-hover': '#a16207',
      'primary-foreground': '#ffffff',
      accent: '#eab308',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-grid-puzzle - Grid-Based Puzzle
// ============================================================================

// ── Reusable main-view effects (grid puzzle board) ──────────────────

const gridPuzzleMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: puzzle icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'puzzle', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Grid Puzzle' },
    ]},
    { type: 'badge', label: 'Playing', variant: 'success', icon: 'zap' },
  ]},
  { type: 'divider' },
  // Stats row: grid size, moves, matches
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Grid Size', icon: 'grid-3x3', value: '@entity.gridSize' },
    { type: 'stats', label: 'Moves', icon: 'target', value: '@entity.moves' },
    { type: 'stats', label: 'Matches', icon: 'star', value: '@entity.matchCount' },
  ]},
  { type: 'divider' },
  // Puzzle grid area
  { type: 'data-grid', entity: 'GridPuzzleData', columns: 3,
    fields: [
      { name: 'gridSize', label: 'Grid', icon: 'grid-3x3', variant: 'h4' },
      { name: 'moves', label: 'Moves', icon: 'target', variant: 'body' },
      { name: 'matchCount', label: 'Matches', icon: 'star', variant: 'badge' },
    ],
  },
]}];

const gridPuzzleMatchedMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header with match indicator
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'star', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Match Found!' },
    ]},
    { type: 'badge', label: 'Matched', variant: 'warning', icon: 'zap' },
  ]},
  { type: 'divider' },
  // Stats row
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Moves', icon: 'target', value: '@entity.moves' },
    { type: 'stats', label: 'Matches', icon: 'star', value: '@entity.matchCount' },
  ]},
  { type: 'divider' },
  { type: 'data-grid', entity: 'GridPuzzleData', columns: 3,
    fields: [
      { name: 'gridSize', label: 'Grid', icon: 'grid-3x3', variant: 'h4' },
      { name: 'moves', label: 'Moves', icon: 'target', variant: 'body' },
      { name: 'matchCount', label: 'Matches', icon: 'star', variant: 'badge' },
    ],
  },
]}];

const gridPuzzleCompletedMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Victory header
  { type: 'stack', direction: 'horizontal', justify: 'center', gap: 'sm', children: [
    { type: 'icon', name: 'trophy', size: 'xl' },
    { type: 'typography', variant: 'h1', content: 'Puzzle Complete!' },
  ]},
  { type: 'divider' },
  // Final stats
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Total Moves', icon: 'target', value: '@entity.moves' },
    { type: 'stats', label: 'Total Matches', icon: 'star', value: '@entity.matchCount' },
  ]},
  { type: 'divider' },
  // Restart button
  { type: 'stack', direction: 'horizontal', justify: 'center', children: [
    { type: 'button', label: 'Play Again', icon: 'refresh-cw', variant: 'primary', action: 'RESTART' },
  ]},
]}];

/**
 * std-grid-puzzle - Grid-based match puzzle mechanics.
 *
 * States: Playing -> Matched -> Completed
 * Tracks grid size, moves, match count, and completion.
 */
export const GRID_PUZZLE_BEHAVIOR: BehaviorSchema = {
  name: 'std-grid-puzzle',
  version: '1.0.0',
  description: 'Grid-based puzzle with match detection',
  theme: PUZZLE_THEME,
  orbitals: [
    {
      name: 'GridPuzzleOrbital',
      entity: {
        name: 'GridPuzzleData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'gridSize', type: 'number', default: 8 },
          { name: 'moves', type: 'number', default: 0 },
          { name: 'matchCount', type: 'number', default: 0 },
          { name: 'isComplete', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'GridPuzzle',
          linkedEntity: 'GridPuzzleData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Playing', isInitial: true },
              { name: 'Matched' },
              { name: 'Completed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SWAP', name: 'Swap Tiles', payloadSchema: [
                { name: 'tileA', type: 'number', required: true },
                { name: 'tileB', type: 'number', required: true },
              ] },
              { key: 'MATCH_FOUND', name: 'Match Found' },
              { key: 'SETTLE', name: 'Settle Board' },
              { key: 'WIN', name: 'Win' },
              { key: 'RESTART', name: 'Restart' },
            ],
            transitions: [
              {
                from: 'Playing',
                to: 'Playing',
                event: 'INIT',
                effects: [
                  ['fetch', 'GridPuzzleData'],
                  ['set', '@entity.moves', 0],
                  ['set', '@entity.matchCount', 0],
                  ['set', '@entity.isComplete', false],
                  gridPuzzleMainEffect,
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'SWAP',
                effects: [
                  ['fetch', 'GridPuzzleData'],
                  ['set', '@entity.moves', ['+', '@entity.moves', 1]],
                  gridPuzzleMainEffect,
                ],
              },
              {
                from: 'Playing',
                to: 'Matched',
                event: 'MATCH_FOUND',
                effects: [
                  ['fetch', 'GridPuzzleData'],
                  ['set', '@entity.matchCount', ['+', '@entity.matchCount', 1]],
                  gridPuzzleMatchedMainEffect,
                ],
              },
              {
                from: 'Matched',
                to: 'Playing',
                event: 'SETTLE',
                effects: [
                  ['fetch', 'GridPuzzleData'],
                  gridPuzzleMainEffect,
                ],
              },
              {
                from: 'Playing',
                to: 'Completed',
                event: 'WIN',
                effects: [
                  ['set', '@entity.isComplete', true],
                  gridPuzzleCompletedMainEffect,
                ],
              },
              {
                from: 'Matched',
                to: 'Completed',
                event: 'WIN',
                effects: [
                  ['set', '@entity.isComplete', true],
                  gridPuzzleCompletedMainEffect,
                ],
              },
              {
                from: 'Completed',
                to: 'Playing',
                event: 'RESTART',
                effects: [
                  ['fetch', 'GridPuzzleData'],
                  ['set', '@entity.moves', 0],
                  ['set', '@entity.matchCount', 0],
                  ['set', '@entity.isComplete', false],
                  gridPuzzleMainEffect,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'GridPuzzlePage',
          path: '/grid-puzzle',
          isInitial: true,
          traits: [{ ref: 'GridPuzzle' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-timer - Game Timer
// ============================================================================

// ── Reusable main-view effects (timer display) ──────────────────────

const timerIdleMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: timer icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'timer', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Timer' },
    ]},
    { type: 'badge', label: 'Idle', variant: 'default', icon: 'timer' },
  ]},
  { type: 'divider' },
  // Time display
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'stats', label: 'Remaining', icon: 'timer', value: '@entity.remaining' },
    { type: 'stats', label: 'Total', icon: 'target', value: '@entity.total' },
  ]},
  // Progress bar
  { type: 'progress-bar', value: 0, max: 100, label: 'Time', icon: 'timer' },
]}];

const timerRunningMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: running state
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'timer', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Timer' },
    ]},
    { type: 'badge', label: 'Running', variant: 'success', icon: 'zap' },
  ]},
  { type: 'divider' },
  // Time display
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'stats', label: 'Remaining', icon: 'timer', value: '@entity.remaining' },
    { type: 'stats', label: 'Total', icon: 'target', value: '@entity.total' },
  ]},
  // Progress bar
  { type: 'progress-bar', value: '@entity.remaining', max: '@entity.total', label: 'Time Left', icon: 'timer' },
  { type: 'divider' },
  // Pause button
  { type: 'stack', direction: 'horizontal', justify: 'center', children: [
    { type: 'button', label: 'Pause', icon: 'pause-circle', variant: 'secondary', action: 'PAUSE' },
  ]},
]}];

const timerPausedMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: paused state
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'timer', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Timer' },
    ]},
    { type: 'badge', label: 'Paused', variant: 'warning', icon: 'pause-circle' },
  ]},
  { type: 'divider' },
  // Time display
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'stats', label: 'Remaining', icon: 'timer', value: '@entity.remaining' },
    { type: 'stats', label: 'Total', icon: 'target', value: '@entity.total' },
  ]},
  // Progress bar
  { type: 'progress-bar', value: '@entity.remaining', max: '@entity.total', label: 'Paused', icon: 'pause-circle' },
  { type: 'divider' },
  // Resume button
  { type: 'stack', direction: 'horizontal', justify: 'center', children: [
    { type: 'button', label: 'Resume', icon: 'play-circle', variant: 'primary', action: 'RESUME' },
  ]},
]}];

const timerExpiredMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: expired state
  { type: 'stack', direction: 'horizontal', justify: 'center', gap: 'sm', children: [
    { type: 'icon', name: 'timer', size: 'xl' },
    { type: 'typography', variant: 'h1', content: 'Time Expired' },
  ]},
  { type: 'divider' },
  // Final stats
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'stats', label: 'Duration', icon: 'target', value: '@entity.total' },
  ]},
  // Progress bar at zero
  { type: 'progress-bar', value: 0, max: '@entity.total', label: 'Expired', icon: 'timer' },
  { type: 'divider' },
  // Reset button
  { type: 'stack', direction: 'horizontal', justify: 'center', children: [
    { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'primary', action: 'RESET' },
  ]},
]}];

/**
 * std-timer - Countdown timer for timed game modes.
 *
 * States: Idle -> Running -> Paused -> Expired
 * Tick counts down remaining time each frame.
 */
export const TIMER_BEHAVIOR: BehaviorSchema = {
  name: 'std-timer',
  version: '1.0.0',
  description: 'Countdown timer with pause and expiry',
  theme: PUZZLE_THEME,
  orbitals: [
    {
      name: 'TimerOrbital',
      entity: {
        name: 'TimerData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'remaining', type: 'number', default: 0 },
          { name: 'total', type: 'number', default: 0 },
          { name: 'isRunning', type: 'boolean', default: false },
          { name: 'isPaused', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'Timer',
          linkedEntity: 'TimerData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Running' },
              { name: 'Paused' },
              { name: 'Expired' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Timer', payloadSchema: [
                { name: 'duration', type: 'number', required: true },
              ] },
              { key: 'PAUSE', name: 'Pause Timer' },
              { key: 'RESUME', name: 'Resume Timer' },
              { key: 'EXPIRE', name: 'Timer Expired' },
              { key: 'RESET', name: 'Reset Timer' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.remaining', 0],
                  ['set', '@entity.total', 0],
                  ['set', '@entity.isRunning', false],
                  ['set', '@entity.isPaused', false],
                  timerIdleMainEffect,
                ],
              },
              {
                from: 'Idle',
                to: 'Running',
                event: 'START',
                effects: [
                  ['set', '@entity.total', '@payload.duration'],
                  ['set', '@entity.remaining', '@payload.duration'],
                  ['set', '@entity.isRunning', true],
                  ['set', '@entity.isPaused', false],
                  timerRunningMainEffect,
                ],
              },
              {
                from: 'Running',
                to: 'Paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.isRunning', false],
                  ['set', '@entity.isPaused', true],
                  timerPausedMainEffect,
                ],
              },
              {
                from: 'Paused',
                to: 'Running',
                event: 'RESUME',
                effects: [
                  ['set', '@entity.isRunning', true],
                  ['set', '@entity.isPaused', false],
                  timerRunningMainEffect,
                ],
              },
              {
                from: 'Running',
                to: 'Expired',
                event: 'EXPIRE',
                effects: [
                  ['set', '@entity.remaining', 0],
                  ['set', '@entity.isRunning', false],
                  timerExpiredMainEffect,
                ],
              },
              {
                from: 'Expired',
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.remaining', 0],
                  ['set', '@entity.total', 0],
                  ['set', '@entity.isRunning', false],
                  ['set', '@entity.isPaused', false],
                  timerIdleMainEffect,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'Countdown',
              interval: 'frame',
              guard: ['and', ['=', '@state', 'Running'], ['>', '@entity.remaining', 0]],
              effects: [
                ['set', '@entity.remaining', ['-', '@entity.remaining', 1]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'TimerPage',
          path: '/timer',
          isInitial: true,
          traits: [{ ref: 'Timer' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-scoring-chain - Combo Scoring
// ============================================================================

// ── Reusable main-view effects (scoring display) ────────────────────

const scoringIdleMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: scoring icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'trophy', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Combo Scoring' },
    ]},
    { type: 'badge', label: 'Ready', variant: 'default', icon: 'target' },
  ]},
  { type: 'divider' },
  // Score stats
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Score', icon: 'trophy', value: '@entity.totalScore' },
    { type: 'stats', label: 'Chain', icon: 'zap', value: '@entity.chainLength' },
    { type: 'stats', label: 'Multiplier', icon: 'star', value: '@entity.multiplier' },
  ]},
  // Multiplier meter
  { type: 'meter', value: '@entity.multiplier', max: 10, label: 'Combo Multiplier', icon: 'zap' },
]}];

const scoringChainingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: chaining state
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'zap', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Combo Active!' },
    ]},
    { type: 'badge', label: 'Chaining', variant: 'success', icon: 'zap' },
  ]},
  { type: 'divider' },
  // Score stats
  { type: 'stack', direction: 'horizontal', gap: 'md', children: [
    { type: 'stats', label: 'Score', icon: 'trophy', value: '@entity.totalScore' },
    { type: 'stats', label: 'Chain', icon: 'zap', value: '@entity.chainLength' },
    { type: 'stats', label: 'Multiplier', icon: 'star', value: '@entity.multiplier' },
  ]},
  // Multiplier meter (growing)
  { type: 'meter', value: '@entity.multiplier', max: 10, label: 'Combo Multiplier', icon: 'zap' },
  { type: 'divider' },
  // Chain progress
  { type: 'progress-bar', value: '@entity.chainLength', max: 20, label: 'Chain Length', icon: 'zap' },
]}];

const scoringBreakingMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: chain broken
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'target', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Chain Broken' },
    ]},
    { type: 'badge', label: 'Broken', variant: 'error', icon: 'target' },
  ]},
  { type: 'divider' },
  // Final score
  { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
    { type: 'stats', label: 'Total Score', icon: 'trophy', value: '@entity.totalScore' },
  ]},
  // Meter reset
  { type: 'meter', value: 1, max: 10, label: 'Multiplier Reset', icon: 'target' },
  { type: 'divider' },
  // Resume button
  { type: 'stack', direction: 'horizontal', justify: 'center', children: [
    { type: 'button', label: 'Continue', icon: 'refresh-cw', variant: 'primary', action: 'RESUME' },
  ]},
]}];

/**
 * std-scoring-chain - Combo-based scoring with multiplier.
 *
 * States: Idle -> Chaining -> Breaking
 * Tracks chain length, multiplier, and total score.
 */
export const SCORING_CHAIN_BEHAVIOR: BehaviorSchema = {
  name: 'std-scoring-chain',
  version: '1.0.0',
  description: 'Combo scoring with chain multiplier',
  theme: PUZZLE_THEME,
  orbitals: [
    {
      name: 'ScoringChainOrbital',
      entity: {
        name: 'ScoringChainData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'chainLength', type: 'number', default: 0 },
          { name: 'multiplier', type: 'number', default: 1 },
          { name: 'totalScore', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'ScoringChain',
          linkedEntity: 'ScoringChainData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Chaining' },
              { name: 'Breaking' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'HIT', name: 'Chain Hit', payloadSchema: [
                { name: 'points', type: 'number', required: true },
              ] },
              { key: 'BREAK', name: 'Break Chain' },
              { key: 'RESET_SCORE', name: 'Reset Score' },
              { key: 'RESUME', name: 'Resume' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.chainLength', 0],
                  ['set', '@entity.multiplier', 1],
                  ['set', '@entity.totalScore', 0],
                  scoringIdleMainEffect,
                ],
              },
              {
                from: 'Idle',
                to: 'Chaining',
                event: 'HIT',
                effects: [
                  ['set', '@entity.chainLength', 1],
                  ['set', '@entity.multiplier', 1],
                  ['set', '@entity.totalScore', ['+', '@entity.totalScore', '@payload.points']],
                  scoringChainingMainEffect,
                ],
              },
              {
                from: 'Chaining',
                to: 'Chaining',
                event: 'HIT',
                effects: [
                  ['set', '@entity.chainLength', ['+', '@entity.chainLength', 1]],
                  ['set', '@entity.multiplier', ['+', '@entity.multiplier', 1]],
                  ['set', '@entity.totalScore', ['+', '@entity.totalScore', ['*', '@payload.points', '@entity.multiplier']]],
                  scoringChainingMainEffect,
                ],
              },
              {
                from: 'Chaining',
                to: 'Breaking',
                event: 'BREAK',
                effects: [
                  ['set', '@entity.chainLength', 0],
                  ['set', '@entity.multiplier', 1],
                  scoringBreakingMainEffect,
                ],
              },
              {
                from: 'Breaking',
                to: 'Idle',
                event: 'RESUME',
                effects: [
                  scoringIdleMainEffect,
                ],
              },
              {
                from: 'Idle',
                to: 'Idle',
                event: 'RESET_SCORE',
                effects: [
                  ['set', '@entity.chainLength', 0],
                  ['set', '@entity.multiplier', 1],
                  ['set', '@entity.totalScore', 0],
                  scoringIdleMainEffect,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ScoringChainPage',
          path: '/scoring-chain',
          isInitial: true,
          traits: [{ ref: 'ScoringChain' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_2D_PUZZLE_BEHAVIORS: BehaviorSchema[] = [
  GRID_PUZZLE_BEHAVIOR,
  TIMER_BEHAVIOR,
  SCORING_CHAIN_BEHAVIOR,
];
