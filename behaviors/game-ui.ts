/**
 * Game UI Behaviors
 *
 * Game interface behaviors: flow, dialogue, level progression.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ============================================================================
// Shared theme for all game-ui behaviors
// ============================================================================

const GAME_UI_THEME = {
  name: 'game-ui-amber',
  tokens: {
    colors: {
      primary: '#d97706',
      'primary-hover': '#b45309',
      'primary-foreground': '#ffffff',
      accent: '#f59e0b',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// Asset constants
// ============================================================================

const KFLOW_ASSETS = 'https://almadar-kflow-assets.web.app/shared';
const GAME_MANIFEST = {
  terrains: {
    grass: '/terrain/Isometric/dirtTiles_N.png',
    stone: '/terrain/Isometric/stoneSide_N.png',
    dirt: '/terrain/Isometric/dirt_N.png',
    bridge: '/terrain/Isometric/stoneStep_N.png',
    wall: '/terrain/Isometric/stoneWallArchway_N.png',
  },
  units: {
    guardian: '/sprite-sheets/guardian-sprite-sheet-se.png',
    breaker: '/sprite-sheets/breaker-sprite-sheet-se.png',
    archivist: '/sprite-sheets/archivist-sprite-sheet-se.png',
  },
  features: {
    gold_mine: '/world-map/gold_mine.png',
    portal: '/world-map/portal_open.png',
    treasure: '/world-map/treasure_chest_closed.png',
    battle_marker: '/world-map/battle_marker.png',
    power_node: '/world-map/power_node.png',
  },
};

const TILES_5X5 = [
  { x: 0, y: 0, terrain: 'stone' }, { x: 1, y: 0, terrain: 'dirt' }, { x: 2, y: 0, terrain: 'stone' }, { x: 3, y: 0, terrain: 'dirt' }, { x: 4, y: 0, terrain: 'stone' },
  { x: 0, y: 1, terrain: 'dirt' }, { x: 1, y: 1, terrain: 'stone' }, { x: 2, y: 1, terrain: 'dirt' }, { x: 3, y: 1, terrain: 'stone' }, { x: 4, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'stone' }, { x: 1, y: 2, terrain: 'dirt' }, { x: 2, y: 2, terrain: 'bridge' }, { x: 3, y: 2, terrain: 'dirt' }, { x: 4, y: 2, terrain: 'stone' },
  { x: 0, y: 3, terrain: 'dirt' }, { x: 1, y: 3, terrain: 'stone' }, { x: 2, y: 3, terrain: 'dirt' }, { x: 3, y: 3, terrain: 'stone' }, { x: 4, y: 3, terrain: 'dirt' },
  { x: 0, y: 4, terrain: 'stone' }, { x: 1, y: 4, terrain: 'dirt' }, { x: 2, y: 4, terrain: 'stone' }, { x: 3, y: 4, terrain: 'wall' }, { x: 4, y: 4, terrain: 'stone' },
];

// ============================================================================
// Shared render-ui compositions
// ============================================================================

const gameMenuView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-menu',
  title: '@entity.title',
  subtitle: 'Press Start to begin',
  menuItems: [
    { label: 'Start Game', event: 'START', variant: 'primary' },
  ],
}];

const gamePlayingCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'player', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const gamePlayingHud: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'game-hud',
  position: 'top',
  elements: [
    { label: 'Status', value: '@entity.status', icon: 'activity' },
    { label: 'Time', value: '@entity.playTime', icon: 'clock' },
    { label: 'Attempts', value: '@entity.attempts', icon: 'hash' },
  ],
}];

const gamePlayingActions: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'horizontal', gap: 'sm', children: [
    { type: 'button', label: 'Pause', action: 'PAUSE', icon: 'pause', variant: 'secondary' },
    { type: 'button', label: 'End Game', action: 'GAME_OVER', icon: 'square', variant: 'destructive' },
  ],
}];

const gamePausedView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-menu',
  title: 'Paused',
  subtitle: 'Game is paused',
  menuItems: [
    { label: 'Resume', event: 'RESUME', variant: 'primary' },
    { label: 'Restart', event: 'RESTART', variant: 'secondary' },
  ],
}];

const gameOverView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-over-screen',
  title: 'Game Over',
  message: 'Better luck next time!',
  variant: 'defeat',
  menuItems: [
    { label: 'Try Again', event: 'RESTART' },
  ],
}];

const dialogueModalView: BehaviorEffect = ['render-ui', 'modal', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'message-square' },
        { type: 'typography', content: '@entity.speaker', variant: 'h2' },
      ] },
    ] },
    { type: 'divider' },
    { type: 'typography', content: '@entity.displayedText', variant: 'body' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'typography', content: '@entity.currentNode', variant: 'label' },
      { type: 'typography', content: '/', variant: 'label' },
      { type: 'typography', content: '@entity.totalNodes', variant: 'label' },
    ] },
    { type: 'progress-bar', value: '@entity.currentNode', max: '@entity.totalNodes' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Next', action: 'NEXT', icon: 'arrow-right', variant: 'primary' },
      { type: 'button', label: 'Close', action: 'CLOSE', icon: 'x', variant: 'secondary' },
    ] },
  ],
}];

const dialogueChoiceModalView: BehaviorEffect = ['render-ui', 'modal', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'list' },
        { type: 'typography', content: 'Choose Response', variant: 'h3' },
      ] },
    ] },
    { type: 'divider' },
    { type: 'typography', content: '@entity.displayedText', variant: 'body' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Continue', action: 'NEXT', icon: 'arrow-right', variant: 'primary' },
      { type: 'button', label: 'Close', action: 'CLOSE', icon: 'x', variant: 'secondary' },
    ] },
  ],
}];

const dialogueHiddenCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'npc', x: 2, y: 2, unitType: 'archivist' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: false,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const dialogueHiddenOverlay: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'typography', content: 'No active dialogue', variant: 'body' },
    { type: 'button', label: 'Start Dialogue', action: 'SHOW', icon: 'message-square', variant: 'primary' },
  ],
}];

const dialogueShowingCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'npc', x: 2, y: 2, unitType: 'archivist' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: false,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const levelBrowsingView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-menu',
  title: 'Select Level',
  subtitle: 'Choose your challenge',
  menuItems: [
    { label: 'Level 1', event: 'SELECT_LEVEL' },
    { label: 'Level 2', event: 'SELECT_LEVEL' },
    { label: 'Level 3', event: 'SELECT_LEVEL' },
  ],
}];

const levelBrowsingHud: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Current', value: '@entity.currentLevel', icon: 'target' },
      { label: 'Total', value: '@entity.totalLevels', icon: 'layers' },
      { label: 'Completed', value: '@entity.completedLevels', icon: 'check-circle' },
    ] },
    { type: 'progress-bar', value: '@entity.completedLevels', max: '@entity.totalLevels' },
  ],
}];

const levelPlayingCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'player', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const levelPlayingHud: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Level', value: '@entity.currentLevel', icon: 'target' },
      { label: 'Name', value: '@entity.levelName', icon: 'tag' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Complete Level', action: 'COMPLETE_LEVEL', icon: 'check', variant: 'primary' },
      { type: 'button', label: 'Back to Levels', action: 'BACK_TO_SELECT', icon: 'arrow-left', variant: 'secondary' },
    ] },
  ],
}];

const levelCompleteView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-over-screen',
  title: 'Level Complete',
  message: 'Well done! Ready for the next challenge?',
  variant: 'victory',
  menuItems: [
    { label: 'Next Level', event: 'COMPLETE_LEVEL' },
    { label: 'Back to Levels', event: 'BACK_TO_SELECT' },
  ],
}];

const levelCompleteHud: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Level', value: '@entity.currentLevel', icon: 'target' },
      { label: 'Completed', value: '@entity.completedLevels', icon: 'check-circle' },
    ] },
    { type: 'progress-bar', value: '@entity.completedLevels', max: '@entity.totalLevels' },
  ],
}];

const allLevelsCompleteView: BehaviorEffect = ['render-ui', 'main', {
  type: 'game-over-screen',
  title: 'All Levels Complete',
  message: 'Congratulations! You conquered every challenge!',
  variant: 'victory',
  menuItems: [
    { label: 'Refresh', event: 'INIT' },
  ],
}];

const allLevelsCompleteHud: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Completed', value: '@entity.completedLevels', icon: 'check-circle' },
      { label: 'Total', value: '@entity.totalLevels', icon: 'layers' },
    ] },
    { type: 'progress-bar', value: '@entity.completedLevels', max: '@entity.totalLevels' },
  ],
}];

// ============================================================================
// std-gameflow - Game State Machine
// ============================================================================

/**
 * std-gameflow - Master game state management.
 *
 * States: Menu -> Playing -> Paused -> GameOver
 * Simplified to use valid patterns and slots only.
 */
export const GAME_FLOW_BEHAVIOR: BehaviorSchema = {
  name: "std-gameflow",
  version: "1.0.0",
  description: "Master game flow: menu, play, pause, game over",
  orbitals: [
    {
      name: "GameFlowOrbital",
      theme: {
        name: "game-ui-amber",
        tokens: {
          colors: {
            primary: "#d97706",
            "primary-hover": "#b45309",
            "primary-foreground": "#ffffff",
            accent: "#f59e0b",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "GameFlowData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "playTime",
            type: "number",
            default: 0,
          },
          {
            name: "attempts",
            type: "number",
            default: 0,
          },
          {
            name: "title",
            type: "string",
            default: "Game",
          },
          {
            name: "status",
            type: "string",
            default: "menu",
          },
        ],
      },
      traits: [
        {
          name: "GameFlow",
          linkedEntity: "GameFlowData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Menu",
                isInitial: true,
              },
              {
                name: "Playing",
              },
              {
                name: "Paused",
              },
              {
                name: "GameOver",
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
                key: "GAME_OVER",
                name: "Game Over",
              },
              {
                key: "RESTART",
                name: "Restart",
              },
              {
                key: "NAVIGATE",
                name: "NAVIGATE",
              },
            ],
            transitions: [
              {
                from: "Menu",
                to: "Menu",
                event: "INIT",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "game-menu",
                      title: "@entity.title",
                      subtitle: "Press Start to begin",
                      menuItems: [
                        {
                          label: "Start Game",
                          event: "START",
                          variant: "primary",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Menu",
                to: "Playing",
                event: "START",
                effects: [
                  ["fetch", "GameFlowData"],
                  [
                    "set",
                    "@entity.attempts",
                    ["+", "@entity.attempts", 1],
                  ],
                  ["set", "@entity.playTime", 0],
                  ["set", "@entity.status", "playing"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      align: "center",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "@entity.title",
                        },
                        {
                          type: "badge",
                          label: "In Progress",
                          variant: "success",
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
                              label: "Status",
                              value: "@entity.status",
                              icon: "activity",
                            },
                            {
                              type: "stat-display",
                              label: "Time",
                              value: "@entity.playTime",
                              icon: "clock",
                            },
                            {
                              type: "stat-display",
                              label: "Attempts",
                              value: "@entity.attempts",
                              icon: "hash",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Pause",
                              event: "PAUSE",
                              variant: "secondary",
                              icon: "pause",
                            },
                            {
                              type: "button",
                              label: "End Game",
                              event: "GAME_OVER",
                              variant: "destructive",
                              icon: "square",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Playing",
                to: "Paused",
                event: "PAUSE",
                effects: [
                  ["set", "@entity.status", "paused"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "game-menu",
                      title: "Paused",
                      subtitle: "Game is paused",
                      menuItems: [
                        {
                          label: "Resume",
                          event: "RESUME",
                          variant: "primary",
                        },
                        {
                          label: "Restart",
                          event: "RESTART",
                          variant: "secondary",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Paused",
                to: "Playing",
                event: "RESUME",
                effects: [
                  ["fetch", "GameFlowData"],
                  ["set", "@entity.status", "playing"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      align: "center",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "@entity.title",
                        },
                        {
                          type: "badge",
                          label: "In Progress",
                          variant: "success",
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
                              label: "Status",
                              value: "@entity.status",
                              icon: "activity",
                            },
                            {
                              type: "stat-display",
                              label: "Time",
                              value: "@entity.playTime",
                              icon: "clock",
                            },
                            {
                              type: "stat-display",
                              label: "Attempts",
                              value: "@entity.attempts",
                              icon: "hash",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Pause",
                              event: "PAUSE",
                              variant: "secondary",
                              icon: "pause",
                            },
                            {
                              type: "button",
                              label: "End Game",
                              event: "GAME_OVER",
                              variant: "destructive",
                              icon: "square",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Playing",
                to: "GameOver",
                event: "GAME_OVER",
                effects: [
                  ["set", "@entity.status", "gameover"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      align: "center",
                      gap: "lg",
                      children: [
                        {
                          type: "icon",
                          name: "trophy",
                          size: "xl",
                        },
                        {
                          type: "typography",
                          variant: "h1",
                          text: "Game Over",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          text: "Better luck next time!",
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
                              label: "Play Time",
                              value: "@entity.playTime",
                              icon: "clock",
                            },
                            {
                              type: "stat-display",
                              label: "Attempts",
                              value: "@entity.attempts",
                              icon: "hash",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Try Again",
                          event: "RESTART",
                          variant: "primary",
                          icon: "refresh-cw",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "GameOver",
                to: "Menu",
                event: "RESTART",
                effects: [
                  ["set", "@entity.status", "menu"],
                  ["set", "@entity.playTime", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "game-menu",
                      title: "@entity.title",
                      subtitle: "Press Start to begin",
                      menuItems: [
                        {
                          label: "Start Game",
                          event: "START",
                          variant: "primary",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Paused",
                to: "Menu",
                event: "RESTART",
                effects: [
                  ["set", "@entity.status", "menu"],
                  ["set", "@entity.playTime", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "game-menu",
                      title: "@entity.title",
                      subtitle: "Press Start to begin",
                      menuItems: [
                        {
                          label: "Start Game",
                          event: "START",
                          variant: "primary",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Menu",
                to: "Menu",
                event: "NAVIGATE",
                effects: [],
              },
              {
                from: "Paused",
                to: "Paused",
                event: "NAVIGATE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "GamePage",
          path: "/game",
          isInitial: true,
          traits: [
            {
              ref: "GameFlow",
            },
          ],
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
export const DIALOGUE_BEHAVIOR: BehaviorSchema = {
  name: "std-dialogue",
  version: "1.0.0",
  description: "NPC dialogue system with branching conversations",
  orbitals: [
    {
      name: "DialogueOrbital",
      theme: {
        name: "game-ui-amber",
        tokens: {
          colors: {
            primary: "#d97706",
            "primary-hover": "#b45309",
            "primary-foreground": "#ffffff",
            accent: "#f59e0b",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "DialogueData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "currentNode",
            type: "number",
            default: 0,
          },
          {
            name: "displayedText",
            type: "string",
            default: "",
          },
          {
            name: "speaker",
            type: "string",
            default: "",
          },
          {
            name: "totalNodes",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "Dialogue",
          linkedEntity: "DialogueData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Hidden",
                isInitial: true,
              },
              {
                name: "Showing",
              },
              {
                name: "Choice",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SHOW",
                name: "Show",
                payloadSchema: [
                  {
                    name: "speaker",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "text",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "totalNodes",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "NEXT",
                name: "Next",
              },
              {
                key: "SELECT_CHOICE",
                name: "Select Choice",
                payloadSchema: [
                  {
                    name: "index",
                    type: "number",
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
                from: "Hidden",
                to: "Hidden",
                event: "INIT",
                effects: [
                  ["fetch", "DialogueData"],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Ready",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "typography",
                          content: "No active dialogue. Start a conversation to begin.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Hidden",
                to: "Showing",
                event: "SHOW",
                effects: [
                  ["fetch", "DialogueData"],
                  ["set", "@entity.speaker", "@payload.speaker"],
                  ["set", "@entity.displayedText", "@payload.text"],
                  ["set", "@entity.totalNodes", "@payload.totalNodes"],
                  ["set", "@entity.currentNode", 0],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                            },
                            {
                              type: "typography",
                              content: "@entity.speaker",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "typography",
                              content: "@entity.displayedText",
                              variant: "body",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "stat-display",
                              label: "Progress",
                              icon: "book-open",
                              value: "@entity.currentNode",
                            },
                            {
                              type: "typography",
                              content: "/",
                              variant: "label",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "layers",
                              value: "@entity.totalNodes",
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
                              label: "Next",
                              icon: "arrow-right",
                              variant: "primary",
                              event: "NEXT",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Showing",
                to: "Showing",
                event: "NEXT",
                guard: [
                  "<",
                  "@entity.currentNode",
                  ["-", "@entity.totalNodes", 1],
                ],
                effects: [
                  ["fetch", "DialogueData"],
                  [
                    "set",
                    "@entity.currentNode",
                    ["+", "@entity.currentNode", 1],
                  ],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                            },
                            {
                              type: "typography",
                              content: "@entity.speaker",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "typography",
                              content: "@entity.displayedText",
                              variant: "body",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "stat-display",
                              label: "Progress",
                              icon: "book-open",
                              value: "@entity.currentNode",
                            },
                            {
                              type: "typography",
                              content: "/",
                              variant: "label",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "layers",
                              value: "@entity.totalNodes",
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
                              label: "Next",
                              icon: "arrow-right",
                              variant: "primary",
                              event: "NEXT",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Showing",
                to: "Hidden",
                event: "NEXT",
                guard: [
                  ">=",
                  "@entity.currentNode",
                  ["-", "@entity.totalNodes", 1],
                ],
                effects: [
                  ["set", "@entity.displayedText", ""],
                  ["set", "@entity.speaker", ""],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Complete",
                          variant: "success",
                          icon: "check-circle",
                        },
                        {
                          type: "typography",
                          content: "Dialogue ended. Start a new conversation to continue.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Showing",
                to: "Choice",
                event: "SELECT_CHOICE",
                effects: [
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "list",
                            },
                            {
                              type: "typography",
                              content: "Choose Response",
                              variant: "h3",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "message-square",
                                },
                                {
                                  type: "typography",
                                  content: "@entity.speaker",
                                  variant: "h4",
                                },
                              ],
                            },
                            {
                              type: "typography",
                              content: "@entity.displayedText",
                              variant: "body",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Accept",
                              icon: "check",
                              variant: "primary",
                              event: "NEXT",
                            },
                            {
                              type: "button",
                              label: "Decline",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Choice",
                to: "Showing",
                event: "NEXT",
                effects: [
                  ["fetch", "DialogueData"],
                  [
                    "set",
                    "@entity.currentNode",
                    ["+", "@entity.currentNode", 1],
                  ],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                            },
                            {
                              type: "typography",
                              content: "@entity.speaker",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "typography",
                              content: "@entity.displayedText",
                              variant: "body",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "stat-display",
                              label: "Progress",
                              icon: "book-open",
                              value: "@entity.currentNode",
                            },
                            {
                              type: "typography",
                              content: "/",
                              variant: "label",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "layers",
                              value: "@entity.totalNodes",
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
                              label: "Next",
                              icon: "arrow-right",
                              variant: "primary",
                              event: "NEXT",
                            },
                            {
                              type: "button",
                              label: "Close",
                              icon: "x",
                              variant: "secondary",
                              event: "CLOSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Showing",
                to: "Hidden",
                event: "CLOSE",
                effects: [
                  ["set", "@entity.displayedText", ""],
                  ["set", "@entity.speaker", ""],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Ready",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "typography",
                          content: "No active dialogue. Start a conversation to begin.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Choice",
                to: "Hidden",
                event: "CLOSE",
                effects: [
                  ["set", "@entity.displayedText", ""],
                  ["set", "@entity.speaker", ""],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Ready",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "typography",
                          content: "No active dialogue. Start a conversation to begin.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Choice",
                to: "Hidden",
                event: "CANCEL",
                effects: [
                  ["set", "@entity.displayedText", ""],
                  ["set", "@entity.speaker", ""],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Ready",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "typography",
                          content: "No active dialogue. Start a conversation to begin.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Showing",
                to: "Hidden",
                event: "CANCEL",
                effects: [
                  ["set", "@entity.displayedText", ""],
                  ["set", "@entity.speaker", ""],
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
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-square",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Dialogue System",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "badge",
                          label: "Ready",
                          variant: "success",
                          icon: "check",
                        },
                        {
                          type: "typography",
                          content: "No active dialogue. Start a conversation to begin.",
                          variant: "body",
                        },
                        {
                          type: "button",
                          label: "Start Dialogue",
                          icon: "message-square",
                          variant: "primary",
                          event: "SHOW",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "DialoguePage",
          path: "/dialogue",
          isInitial: true,
          traits: [
            {
              ref: "Dialogue",
            },
          ],
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
export const LEVEL_PROGRESS_BEHAVIOR: BehaviorSchema = {
  name: "std-levelprogress",
  version: "1.0.0",
  description: "Level progression with selection and completion tracking",
  orbitals: [
    {
      name: "LevelProgressOrbital",
      theme: {
        name: "game-ui-amber",
        tokens: {
          colors: {
            primary: "#d97706",
            "primary-hover": "#b45309",
            "primary-foreground": "#ffffff",
            accent: "#f59e0b",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "LevelData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "currentLevel",
            type: "number",
            default: 0,
          },
          {
            name: "totalLevels",
            type: "number",
            default: 10,
          },
          {
            name: "completedLevels",
            type: "number",
            default: 0,
          },
          {
            name: "levelName",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "browsing",
          },
        ],
      },
      traits: [
        {
          name: "LevelProgress",
          linkedEntity: "LevelData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Browsing",
                isInitial: true,
              },
              {
                name: "Playing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SELECT_LEVEL",
                name: "Select Level",
                payloadSchema: [
                  {
                    name: "level",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "COMPLETE_LEVEL",
                name: "Complete Level",
              },
              {
                key: "BACK_TO_SELECT",
                name: "Back To Select",
              },
            ],
            transitions: [
              {
                from: "Browsing",
                to: "Browsing",
                event: "INIT",
                effects: [
                  ["fetch", "LevelData"],
                  ["set", "@entity.status", "browsing"],
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
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "trophy",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Level Progress",
                            },
                            {
                              type: "badge",
                              label: "Browsing",
                              variant: "info",
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
                              label: "Current Level",
                              value: "@entity.currentLevel",
                            },
                            {
                              type: "stat-display",
                              label: "Total Levels",
                              value: "@entity.totalLevels",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              value: "@entity.completedLevels",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.completedLevels",
                          max: "@entity.totalLevels",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Select Level",
                              icon: "play",
                              variant: "primary",
                              event: "SELECT_LEVEL",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Browsing",
                to: "Playing",
                event: "SELECT_LEVEL",
                guard: ["<=", "@payload.level", "@entity.totalLevels"],
                effects: [
                  ["fetch", "LevelData"],
                  ["set", "@entity.currentLevel", "@payload.level"],
                  ["set", "@entity.status", "playing"],
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
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "trophy",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Level Progress",
                            },
                            {
                              type: "badge",
                              label: "Playing",
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
                              label: "Current Level",
                              value: "@entity.currentLevel",
                            },
                            {
                              type: "stat-display",
                              label: "Total Levels",
                              value: "@entity.totalLevels",
                            },
                          ],
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "@entity.levelName",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.completedLevels",
                          max: "@entity.totalLevels",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Complete Level",
                              icon: "check",
                              variant: "primary",
                              event: "COMPLETE_LEVEL",
                            },
                            {
                              type: "button",
                              label: "Back to Levels",
                              icon: "arrow-left",
                              variant: "secondary",
                              event: "BACK_TO_SELECT",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Playing",
                to: "Playing",
                event: "COMPLETE_LEVEL",
                guard: ["<", "@entity.currentLevel", "@entity.totalLevels"],
                effects: [
                  [
                    "set",
                    "@entity.completedLevels",
                    ["+", "@entity.completedLevels", 1],
                  ],
                  [
                    "set",
                    "@entity.currentLevel",
                    ["+", "@entity.currentLevel", 1],
                  ],
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
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "trophy",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Level Complete!",
                            },
                            {
                              type: "badge",
                              label: "Playing",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Well done! Ready for the next challenge?",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Level",
                              value: "@entity.currentLevel",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              value: "@entity.completedLevels",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.completedLevels",
                          max: "@entity.totalLevels",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Complete Level",
                              icon: "check",
                              variant: "primary",
                              event: "COMPLETE_LEVEL",
                            },
                            {
                              type: "button",
                              label: "Back to Levels",
                              icon: "arrow-left",
                              variant: "secondary",
                              event: "BACK_TO_SELECT",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Playing",
                to: "Browsing",
                event: "COMPLETE_LEVEL",
                guard: [">=", "@entity.currentLevel", "@entity.totalLevels"],
                effects: [
                  ["fetch", "LevelData"],
                  [
                    "set",
                    "@entity.completedLevels",
                    ["+", "@entity.completedLevels", 1],
                  ],
                  ["set", "@entity.status", "browsing"],
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
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "trophy",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "All Levels Complete!",
                            },
                            {
                              type: "badge",
                              label: "Complete",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Congratulations! You conquered every challenge!",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Completed",
                              value: "@entity.completedLevels",
                            },
                            {
                              type: "stat-display",
                              label: "Total Levels",
                              value: "@entity.totalLevels",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.completedLevels",
                          max: "@entity.totalLevels",
                        },
                        {
                          type: "button",
                          label: "Start Over",
                          icon: "refresh-cw",
                          variant: "primary",
                          event: "INIT",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Playing",
                to: "Browsing",
                event: "BACK_TO_SELECT",
                effects: [
                  ["fetch", "LevelData"],
                  ["set", "@entity.status", "browsing"],
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
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "trophy",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Level Progress",
                            },
                            {
                              type: "badge",
                              label: "Browsing",
                              variant: "info",
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
                              label: "Current Level",
                              value: "@entity.currentLevel",
                            },
                            {
                              type: "stat-display",
                              label: "Total Levels",
                              value: "@entity.totalLevels",
                            },
                            {
                              type: "stat-display",
                              label: "Completed",
                              value: "@entity.completedLevels",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.completedLevels",
                          max: "@entity.totalLevels",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Select Level",
                              icon: "play",
                              variant: "primary",
                              event: "SELECT_LEVEL",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "LevelsPage",
          path: "/levels",
          isInitial: true,
          traits: [
            {
              ref: "LevelProgress",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_UI_BEHAVIORS: BehaviorSchema[] = [
  GAME_FLOW_BEHAVIOR,
  DIALOGUE_BEHAVIOR,
  LEVEL_PROGRESS_BEHAVIOR,
];
