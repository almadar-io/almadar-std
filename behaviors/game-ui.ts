/**
 * Game UI Behaviors
 *
 * Game interface behaviors: flow, dialogue, level progression.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-gameflow - Game State Machine
// ============================================================================

/**
 * std-gameflow - Master game state management.
 *
 * States: Menu -> Playing -> Paused -> GameOver
 * Simplified to use valid patterns and slots only.
 */
export const GAME_FLOW_BEHAVIOR: OrbitalSchema = {
  name: 'std-gameflow',
  version: '1.0.0',
  description: 'Master game flow: menu, play, pause, game over',
  orbitals: [
    {
      name: 'GameFlowOrbital',
      entity: {
        name: 'GameFlowState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'playTime', type: 'number', default: 0 },
          { name: 'attempts', type: 'number', default: 0 },
          { name: 'title', type: 'string', default: 'Game' },
          { name: 'status', type: 'string', default: 'menu' },
        ],
      },
      traits: [
        {
          name: 'GameFlow',
          linkedEntity: 'GameFlowState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Menu', isInitial: true },
              { name: 'Playing' },
              { name: 'Paused' },
              { name: 'GameOver' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start' },
              { key: 'PAUSE', name: 'Pause' },
              { key: 'RESUME', name: 'Resume' },
              { key: 'GAME_OVER', name: 'Game Over' },
              { key: 'RESTART', name: 'Restart' },
            ],
            transitions: [
              {
                from: 'Menu',
                to: 'Menu',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', { type: 'page-header',  title: 'Game Menu' }],
                  ['render-ui', 'main', { type: 'card', actions: [{ label: 'Start Game', event: 'START' }] }, { entity: 'GameFlowState' }],
                ],
              },
              {
                from: 'Menu',
                to: 'Playing',
                event: 'START',
                effects: [
                  ['fetch', 'GameFlowState'],
                  ['set', '@entity.attempts', ['+', '@entity.attempts', 1]],
                  ['set', '@entity.playTime', 0],
                  ['set', '@entity.status', 'playing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Playing' }],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'GameFlowState',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Paused',
                event: 'PAUSE',
                effects: [
                  ['set', '@entity.status', 'paused'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Paused' }],
                  ['render-ui', 'main', { type: 'card', actions: [
                      { label: 'Resume', event: 'RESUME' },
                      { label: 'Restart', event: 'RESTART' },
                    ] }, { entity: 'GameFlowState' }],
                ],
              },
              {
                from: 'Paused',
                to: 'Playing',
                event: 'RESUME',
                effects: [
                  ['fetch', 'GameFlowState'],
                  ['set', '@entity.status', 'playing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Playing' }],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'GameFlowState',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'GameOver',
                event: 'GAME_OVER',
                effects: [
                  ['set', '@entity.status', 'gameover'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Game Over' }],
                  ['render-ui', 'main', { type: 'card', actions: [{ label: 'Try Again', event: 'RESTART' }] }, { entity: 'GameFlowState' }],
                ],
              },
              {
                from: 'GameOver',
                to: 'Menu',
                event: 'RESTART',
                effects: [
                  ['set', '@entity.status', 'menu'],
                  ['set', '@entity.playTime', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Game Menu' }],
                  ['render-ui', 'main', { type: 'card', actions: [{ label: 'Start Game', event: 'START' }] }, { entity: 'GameFlowState' }],
                ],
              },
              {
                from: 'Paused',
                to: 'Menu',
                event: 'RESTART',
                effects: [
                  ['set', '@entity.status', 'menu'],
                  ['set', '@entity.playTime', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Game Menu' }],
                  ['render-ui', 'main', { type: 'card', actions: [{ label: 'Start Game', event: 'START' }] }, { entity: 'GameFlowState' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'GamePage',
          path: '/game',
          isInitial: true,
          traits: [{ ref: 'GameFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-dialogue - NPC Conversation System
// ============================================================================

/**
 * std-dialogue - Manages NPC dialogue display.
 *
 * Simplified: States: Hidden -> Showing -> Choice
 * No typewriter effect, no complex s-expressions.
 */
export const DIALOGUE_BEHAVIOR: OrbitalSchema = {
  name: 'std-dialogue',
  version: '1.0.0',
  description: 'NPC dialogue system with branching conversations',
  orbitals: [
    {
      name: 'DialogueOrbital',
      entity: {
        name: 'DialogueState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentNode', type: 'number', default: 0 },
          { name: 'displayedText', type: 'string', default: '' },
          { name: 'speaker', type: 'string', default: '' },
          { name: 'totalNodes', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'Dialogue',
          linkedEntity: 'DialogueState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Hidden', isInitial: true },
              { name: 'Showing' },
              { name: 'Choice' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SHOW', name: 'Show', payloadSchema: [
                { name: 'speaker', type: 'string', required: true },
                { name: 'text', type: 'string', required: true },
                { name: 'totalNodes', type: 'number', required: true },
              ] },
              { key: 'NEXT', name: 'Next' },
              { key: 'SELECT_CHOICE', name: 'Select Choice', payloadSchema: [
                { name: 'index', type: 'number', required: true },
              ] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'Hidden',
                to: 'Hidden',
                event: 'INIT',
                effects: [
                  ['fetch', 'DialogueState'],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'DialogueState' }],
                ],
              },
              {
                from: 'Hidden',
                to: 'Showing',
                event: 'SHOW',
                effects: [
                  ['fetch', 'DialogueState'],
                  ['set', '@entity.speaker', '@payload.speaker'],
                  ['set', '@entity.displayedText', '@payload.text'],
                  ['set', '@entity.totalNodes', '@payload.totalNodes'],
                  ['set', '@entity.currentNode', 0],
                  ['render-ui', 'modal', { type: 'detail-panel', entity: 'DialogueState',
                    actions: [
                      { label: 'Next', event: 'NEXT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'Showing',
                to: 'Showing',
                event: 'NEXT',
                guard: ['<', '@entity.currentNode', ['-', '@entity.totalNodes', 1]],
                effects: [
                  ['fetch', 'DialogueState'],
                  ['set', '@entity.currentNode', ['+', '@entity.currentNode', 1]],
                  ['render-ui', 'modal', { type: 'detail-panel', entity: 'DialogueState',
                    actions: [
                      { label: 'Next', event: 'NEXT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'Showing',
                to: 'Hidden',
                event: 'NEXT',
                guard: ['>=', '@entity.currentNode', ['-', '@entity.totalNodes', 1]],
                effects: [
                  ['set', '@entity.displayedText', ''],
                  ['set', '@entity.speaker', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'Showing',
                to: 'Choice',
                event: 'SELECT_CHOICE',
                effects: [
                  ['render-ui', 'modal', { type: 'card', actions: [
                      { label: 'Continue', event: 'NEXT' },
                      { label: 'Close', event: 'CLOSE' },
                    ] }, { entity: 'DialogueState' }],
                ],
              },
              {
                from: 'Choice',
                to: 'Showing',
                event: 'NEXT',
                effects: [
                  ['fetch', 'DialogueState'],
                  ['set', '@entity.currentNode', ['+', '@entity.currentNode', 1]],
                  ['render-ui', 'modal', { type: 'detail-panel', entity: 'DialogueState',
                    actions: [
                      { label: 'Next', event: 'NEXT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'Showing',
                to: 'Hidden',
                event: 'CLOSE',
                effects: [
                  ['set', '@entity.displayedText', ''],
                  ['set', '@entity.speaker', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'Choice',
                to: 'Hidden',
                event: 'CLOSE',
                effects: [
                  ['set', '@entity.displayedText', ''],
                  ['set', '@entity.speaker', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'Choice',
                to: 'Hidden',
                event: 'CANCEL',
                effects: [
                  ['set', '@entity.displayedText', ''],
                  ['set', '@entity.speaker', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'Showing',
                to: 'Hidden',
                event: 'CANCEL',
                effects: [
                  ['set', '@entity.displayedText', ''],
                  ['set', '@entity.speaker', ''],
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'DialoguePage',
          path: '/dialogue',
          isInitial: true,
          traits: [{ ref: 'Dialogue' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-levelprogress - Level Unlock and Progression
// ============================================================================

/**
 * std-levelprogress - Manages level selection and completion tracking.
 *
 * Simplified: States: Browsing -> Playing
 * No complex operators, no external emits, no persist effects.
 */
export const LEVEL_PROGRESS_BEHAVIOR: OrbitalSchema = {
  name: 'std-levelprogress',
  version: '1.0.0',
  description: 'Level progression with selection and completion tracking',
  orbitals: [
    {
      name: 'LevelProgressOrbital',
      entity: {
        name: 'LevelState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentLevel', type: 'number', default: 0 },
          { name: 'totalLevels', type: 'number', default: 10 },
          { name: 'completedLevels', type: 'number', default: 0 },
          { name: 'levelName', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'browsing' },
        ],
      },
      traits: [
        {
          name: 'LevelProgress',
          linkedEntity: 'LevelState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Browsing', isInitial: true },
              { name: 'Playing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_LEVEL', name: 'Select Level', payloadSchema: [
                { name: 'level', type: 'number', required: true },
              ] },
              { key: 'COMPLETE_LEVEL', name: 'Complete Level' },
              { key: 'BACK_TO_SELECT', name: 'Back To Select' },
            ],
            transitions: [
              {
                from: 'Browsing',
                to: 'Browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'LevelState'],
                  ['set', '@entity.status', 'browsing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Select Level' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'LevelState',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Playing',
                event: 'SELECT_LEVEL',
                guard: ['<=', '@payload.level', '@entity.totalLevels'],
                effects: [
                  ['fetch', 'LevelState'],
                  ['set', '@entity.currentLevel', '@payload.level'],
                  ['set', '@entity.status', 'playing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Playing Level' }],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'LevelState',
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'COMPLETE_LEVEL',
                guard: ['<', '@entity.currentLevel', '@entity.totalLevels'],
                effects: [
                  ['set', '@entity.completedLevels', ['+', '@entity.completedLevels', 1]],
                  ['set', '@entity.currentLevel', ['+', '@entity.currentLevel', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Level Complete' }],
                  ['render-ui', 'main', { type: 'card', actions: [
                      { label: 'Next Level', event: 'COMPLETE_LEVEL' },
                      { label: 'Back to Levels', event: 'BACK_TO_SELECT' },
                    ] }, { entity: 'LevelState' }],
                ],
              },
              {
                from: 'Playing',
                to: 'Browsing',
                event: 'COMPLETE_LEVEL',
                guard: ['>=', '@entity.currentLevel', '@entity.totalLevels'],
                effects: [
                  ['fetch', 'LevelState'],
                  ['set', '@entity.completedLevels', ['+', '@entity.completedLevels', 1]],
                  ['set', '@entity.status', 'browsing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'All Levels Complete' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'LevelState',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'Playing',
                to: 'Browsing',
                event: 'BACK_TO_SELECT',
                effects: [
                  ['fetch', 'LevelState'],
                  ['set', '@entity.status', 'browsing'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Select Level' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'LevelState',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'LevelsPage',
          path: '/levels',
          isInitial: true,
          traits: [{ ref: 'LevelProgress' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_UI_BEHAVIORS: OrbitalSchema[] = [
  GAME_FLOW_BEHAVIOR,
  DIALOGUE_BEHAVIOR,
  LEVEL_PROGRESS_BEHAVIOR,
];
