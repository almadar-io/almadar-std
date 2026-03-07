/**
 * 2D Puzzle Game Behaviors
 *
 * Standard behaviors for 2D puzzle games: grid puzzles, timers,
 * and combo scoring chains.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-grid-puzzle - Grid-Based Puzzle
// ============================================================================

/**
 * std-grid-puzzle - Grid-based match puzzle mechanics.
 *
 * States: Playing -> Matched -> Completed
 * Tracks grid size, moves, match count, and completion.
 */
export const GRID_PUZZLE_BEHAVIOR: OrbitalSchema = {
  name: 'std-grid-puzzle',
  version: '1.0.0',
  description: 'Grid-based puzzle with match detection',
  orbitals: [
    {
      name: 'GridPuzzleOrbital',
      entity: {
        name: 'GridPuzzleState',
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
          linkedEntity: 'GridPuzzleState',
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
                  ['fetch', 'GridPuzzleState'],
                  ['set', '@entity.moves', 0],
                  ['set', '@entity.matchCount', 0],
                  ['set', '@entity.isComplete', false],
                  ['render-ui', 'main', { type: 'page-header', title: 'Grid Puzzle' }],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'GridPuzzleState',
                  }],
                  ['render-ui', 'hud-top', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'SWAP',
                effects: [
                  ['fetch', 'GridPuzzleState'],
                  ['set', '@entity.moves', ['+', '@entity.moves', 1]],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'GridPuzzleState',
                  }],
                  ['render-ui', 'hud-top', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Matched',
                event: 'MATCH_FOUND',
                effects: [
                  ['fetch', 'GridPuzzleState'],
                  ['set', '@entity.matchCount', ['+', '@entity.matchCount', 1]],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'GridPuzzleState',
                  }],
                  ['render-ui', 'hud-top', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
                ],
              },
              {
                from: 'Matched',
                to: 'Playing',
                event: 'SETTLE',
                effects: [
                  ['fetch', 'GridPuzzleState'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'GridPuzzleState',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Completed',
                event: 'WIN',
                effects: [
                  ['set', '@entity.isComplete', true],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Game Over',
                  }],
                ],
              },
              {
                from: 'Matched',
                to: 'Completed',
                event: 'WIN',
                effects: [
                  ['set', '@entity.isComplete', true],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Game Over',
                  }],
                ],
              },
              {
                from: 'Completed',
                to: 'Playing',
                event: 'RESTART',
                effects: [
                  ['fetch', 'GridPuzzleState'],
                  ['set', '@entity.moves', 0],
                  ['set', '@entity.matchCount', 0],
                  ['set', '@entity.isComplete', false],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'GridPuzzleState',
                  }],
                  ['render-ui', 'hud-top', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
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

/**
 * std-timer - Countdown timer for timed game modes.
 *
 * States: Idle -> Running -> Paused -> Expired
 * Tick counts down remaining time each frame.
 */
export const TIMER_BEHAVIOR: OrbitalSchema = {
  name: 'std-timer',
  version: '1.0.0',
  description: 'Countdown timer with pause and expiry',
  orbitals: [
    {
      name: 'TimerOrbital',
      entity: {
        name: 'TimerState',
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
          linkedEntity: 'TimerState',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Timer' }],
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Time',
                  }],
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
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Time',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.isRunning', false],
                  ['set', '@entity.isPaused', true],
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Time',
                  }],
                ],
              },
              {
                from: 'Paused',
                to: 'Running',
                event: 'RESUME',
                effects: [
                  ['set', '@entity.isRunning', true],
                  ['set', '@entity.isPaused', false],
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Time',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Expired',
                event: 'EXPIRE',
                effects: [
                  ['set', '@entity.remaining', 0],
                  ['set', '@entity.isRunning', false],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Time Expired',
                  }],
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
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Time',
                  }],
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

/**
 * std-scoring-chain - Combo-based scoring with multiplier.
 *
 * States: Idle -> Chaining -> Breaking
 * Tracks chain length, multiplier, and total score.
 */
export const SCORING_CHAIN_BEHAVIOR: OrbitalSchema = {
  name: 'std-scoring-chain',
  version: '1.0.0',
  description: 'Combo scoring with chain multiplier',
  orbitals: [
    {
      name: 'ScoringChainOrbital',
      entity: {
        name: 'ScoringChainState',
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
          linkedEntity: 'ScoringChainState',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Scoring' }],
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
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
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
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
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
                ],
              },
              {
                from: 'Chaining',
                to: 'Breaking',
                event: 'BREAK',
                effects: [
                  ['set', '@entity.chainLength', 0],
                  ['set', '@entity.multiplier', 1],
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
                ],
              },
              {
                from: 'Breaking',
                to: 'Idle',
                event: 'RESUME',
                effects: [
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
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
                  ['render-ui', 'main', { type: 'score-display',
                    value: 0, label: 'Score',
                  }],
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

export const GAME_2D_PUZZLE_BEHAVIORS: OrbitalSchema[] = [
  GRID_PUZZLE_BEHAVIOR,
  TIMER_BEHAVIOR,
  SCORING_CHAIN_BEHAVIOR,
];
