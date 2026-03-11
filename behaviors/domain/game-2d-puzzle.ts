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

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

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

// ── Shared asset constants ───────────────────────────────────────────

const PUZZLE_ASSET_BASE_URL = 'https://almadar-kflow-assets.web.app/shared';

const PUZZLE_ASSET_MANIFEST = {
  terrain: {
    dirt: '/terrain/Isometric/dirt_N.png',
    stone: '/terrain/Isometric/stoneSide_N.png',
    bridge: '/terrain/Isometric/stoneStep_N.png',
    wall: '/terrain/Isometric/stoneWallArchway_N.png',
  },
  units: {
    guardian: '/sprite-sheets/guardian-sprite-sheet-se.png',
    breaker: '/sprite-sheets/breaker-sprite-sheet-se.png',
  },
  features: {
    gold_mine: '/world-map/gold_mine.png',
    portal: '/world-map/portal_open.png',
  },
};

// ── 4x4 puzzle board tiles ──────────────────────────────────────────

const PUZZLE_BOARD_TILES = [
  { x: 0, y: 0, terrain: 'stone' }, { x: 1, y: 0, terrain: 'dirt' },   { x: 2, y: 0, terrain: 'dirt' },   { x: 3, y: 0, terrain: 'stone' },
  { x: 0, y: 1, terrain: 'dirt' },  { x: 1, y: 1, terrain: 'bridge' }, { x: 2, y: 1, terrain: 'bridge' }, { x: 3, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'dirt' },  { x: 1, y: 2, terrain: 'bridge' }, { x: 2, y: 2, terrain: 'bridge' }, { x: 3, y: 2, terrain: 'dirt' },
  { x: 0, y: 3, terrain: 'stone' }, { x: 1, y: 3, terrain: 'dirt' },   { x: 2, y: 3, terrain: 'dirt' },   { x: 3, y: 3, terrain: 'stone' },
];

// ── Reusable render-ui effects (grid puzzle: isometric canvas + HUD) ─

const gridPuzzleMainEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'GridPuzzleData',
    boardWidth: 4,
    boardHeight: 4,
    tiles: PUZZLE_BOARD_TILES,
    units: [],
    scale: 1,
    enableCamera: false,
    assetBaseUrl: PUZZLE_ASSET_BASE_URL,
    assetManifest: PUZZLE_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'grid-3x3', label: 'Grid', value: '@entity.gridSize' },
      { icon: 'target', label: 'Moves', value: '@entity.moves' },
      { icon: 'star', label: 'Matches', value: '@entity.matchCount' },
    ]},
    { type: 'badge', label: 'Playing', variant: 'success', icon: 'zap' },
  ]}],
];

const gridPuzzleMatchedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'GridPuzzleData',
    boardWidth: 4,
    boardHeight: 4,
    tiles: PUZZLE_BOARD_TILES,
    units: [],
    scale: 1,
    enableCamera: false,
    assetBaseUrl: PUZZLE_ASSET_BASE_URL,
    assetManifest: PUZZLE_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'target', label: 'Moves', value: '@entity.moves' },
      { icon: 'star', label: 'Matches', value: '@entity.matchCount' },
    ]},
    { type: 'badge', label: 'Match Found!', variant: 'warning', icon: 'star' },
  ]}],
];

const gridPuzzleCompletedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'center', gap: 'sm', children: [
      { type: 'icon', name: 'trophy', size: 'xl' },
      { type: 'typography', variant: 'h1', content: 'Puzzle Complete!' },
    ]},
    { type: 'divider' },
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'target', label: 'Total Moves', value: '@entity.moves' },
      { icon: 'star', label: 'Total Matches', value: '@entity.matchCount' },
    ]},
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', justify: 'center', children: [
      { type: 'button', label: 'Play Again', icon: 'refresh-cw', variant: 'primary', action: 'RESTART' },
    ]},
  ]}],
];

/**
 * std-grid-puzzle - Grid-based match puzzle mechanics.
 *
 * States: Playing -> Matched -> Completed
 * Tracks grid size, moves, match count, and completion.
 */
export const GRID_PUZZLE_BEHAVIOR: BehaviorSchema = {
  name: "std-grid-puzzle",
  version: "1.0.0",
  description: "Grid-based puzzle with match detection",
  theme: {
    name: "game-puzzle-yellow",
    tokens: {
      colors: {
        primary: "#ca8a04",
        "primary-hover": "#a16207",
        "primary-foreground": "#ffffff",
        accent: "#eab308",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "GridPuzzleOrbital",
      entity: {
        name: "GridPuzzleData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "gridSize",
            type: "number",
            default: 6,
          },
          {
            name: "score",
            type: "number",
            default: 0,
          },
          {
            name: "moves",
            type: "number",
            default: 0,
          },
          {
            name: "movesRemaining",
            type: "number",
            default: 30,
          },
          {
            name: "matchCount",
            type: "number",
            default: 0,
          },
          {
            name: "level",
            type: "number",
            default: 1,
          },
          {
            name: "isComplete",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "GridPuzzle",
          linkedEntity: "GridPuzzleData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Playing",
                isInitial: true,
              },
              {
                name: "Matched",
              },
              {
                name: "Completed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SWAP",
                name: "Swap Tiles",
                payloadSchema: [
                  {
                    name: "tileA",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "tileB",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "MATCH_FOUND",
                name: "Match Found",
              },
              {
                key: "SETTLE",
                name: "Settle Board",
              },
              {
                key: "WIN",
                name: "Win",
              },
              {
                key: "RESTART",
                name: "Restart",
              },
              {
                key: "SHUFFLE",
                name: "Shuffle Board",
              },
              {
                key: "HINT",
                name: "Show Hint",
              },
            ],
            transitions: [
              {
                from: "Playing",
                to: "Playing",
                event: "INIT",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  ["set", "@entity.moves", 0],
                  ["set", "@entity.movesRemaining", 30],
                  ["set", "@entity.matchCount", 0],
                  ["set", "@entity.score", 0],
                  ["set", "@entity.isComplete", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "grid-3x3",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Grid Puzzle",
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
                          type: "score-display",
                          score: "@entity.score",
                          label: "Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Moves Left",
                              value: "@entity.movesRemaining",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "xs",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.matchCount",
                          max: 10,
                          label: "Match Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Shuffle",
                              icon: "shuffle",
                              variant: "secondary",
                              event: "SHUFFLE",
                            },
                            {
                              type: "button",
                              label: "Hint",
                              icon: "lightbulb",
                              variant: "outline",
                              event: "HINT",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "destructive",
                              event: "RESTART",
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
                event: "SWAP",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  [
                    "set",
                    "@entity.moves",
                    ["+", "@entity.moves", 1],
                  ],
                  [
                    "set",
                    "@entity.movesRemaining",
                    ["-", "@entity.movesRemaining", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "grid-3x3",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Grid Puzzle",
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
                          type: "score-display",
                          score: "@entity.score",
                          label: "Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Moves Left",
                              value: "@entity.movesRemaining",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "xs",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.matchCount",
                          max: 10,
                          label: "Match Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Shuffle",
                              icon: "shuffle",
                              variant: "secondary",
                              event: "SHUFFLE",
                            },
                            {
                              type: "button",
                              label: "Hint",
                              icon: "lightbulb",
                              variant: "outline",
                              event: "HINT",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "destructive",
                              event: "RESTART",
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
                to: "Matched",
                event: "MATCH_FOUND",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  [
                    "set",
                    "@entity.matchCount",
                    ["+", "@entity.matchCount", 1],
                  ],
                  [
                    "set",
                    "@entity.score",
                    ["+", "@entity.score", 100],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "grid-3x3",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Grid Puzzle",
                            },
                            {
                              type: "badge",
                              label: "Match!",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "score-display",
                          score: "@entity.score",
                          label: "Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Moves Left",
                              value: "@entity.movesRemaining",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "xs",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "stat-badge",
                                  label: "Match!",
                                  value: "+100",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.matchCount",
                          max: 10,
                          label: "Match Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Shuffle",
                              icon: "shuffle",
                              variant: "secondary",
                              event: "SHUFFLE",
                            },
                            {
                              type: "button",
                              label: "Hint",
                              icon: "lightbulb",
                              variant: "outline",
                              event: "HINT",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "destructive",
                              event: "RESTART",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Matched",
                to: "Playing",
                event: "SETTLE",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "grid-3x3",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Grid Puzzle",
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
                          type: "score-display",
                          score: "@entity.score",
                          label: "Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Moves Left",
                              value: "@entity.movesRemaining",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "xs",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.matchCount",
                          max: 10,
                          label: "Match Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Shuffle",
                              icon: "shuffle",
                              variant: "secondary",
                              event: "SHUFFLE",
                            },
                            {
                              type: "button",
                              label: "Hint",
                              icon: "lightbulb",
                              variant: "outline",
                              event: "HINT",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "destructive",
                              event: "RESTART",
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
                to: "Completed",
                event: "WIN",
                effects: [
                  ["set", "@entity.isComplete", true],
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
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h1",
                              content: "Puzzle Complete!",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "score-display",
                          score: "@entity.score",
                          label: "Final Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Moves",
                              value: "@entity.moves",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Total Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Play Again",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESTART",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Matched",
                to: "Completed",
                event: "WIN",
                effects: [
                  ["set", "@entity.isComplete", true],
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
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h1",
                              content: "Puzzle Complete!",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "score-display",
                          score: "@entity.score",
                          label: "Final Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Moves",
                              value: "@entity.moves",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Total Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Play Again",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESTART",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Completed",
                to: "Playing",
                event: "RESTART",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  ["set", "@entity.moves", 0],
                  ["set", "@entity.movesRemaining", 30],
                  ["set", "@entity.matchCount", 0],
                  ["set", "@entity.score", 0],
                  ["set", "@entity.isComplete", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "grid-3x3",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Grid Puzzle",
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
                          type: "score-display",
                          score: "@entity.score",
                          label: "Score",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Moves Left",
                              value: "@entity.movesRemaining",
                              icon: "move",
                            },
                            {
                              type: "stat-display",
                              label: "Matches",
                              value: "@entity.matchCount",
                              icon: "star",
                            },
                            {
                              type: "stat-display",
                              label: "Level",
                              value: "@entity.level",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "xs",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "xs",
                              children: [
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                                {
                                  type: "badge",
                                  label: "R",
                                  variant: "error",
                                },
                                {
                                  type: "badge",
                                  label: "B",
                                  variant: "info",
                                },
                                {
                                  type: "badge",
                                  label: "G",
                                  variant: "success",
                                },
                                {
                                  type: "badge",
                                  label: "Y",
                                  variant: "warning",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.matchCount",
                          max: 10,
                          label: "Match Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Shuffle",
                              icon: "shuffle",
                              variant: "secondary",
                              event: "SHUFFLE",
                            },
                            {
                              type: "button",
                              label: "Hint",
                              icon: "lightbulb",
                              variant: "outline",
                              event: "HINT",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "destructive",
                              event: "RESTART",
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
                event: "SHUFFLE",
                effects: [
                  ["fetch", "GridPuzzleData"],
                  [
                    "set",
                    "@entity.moves",
                    ["+", "@entity.moves", 1],
                  ],
                  [
                    "set",
                    "@entity.movesRemaining",
                    ["-", "@entity.movesRemaining", 1],
                  ],
                ],
              },
              {
                from: "Playing",
                to: "Playing",
                event: "HINT",
                effects: [
                  ["fetch", "GridPuzzleData"],
                ],
              },
              {
                from: "Matched",
                to: "Matched",
                event: "SHUFFLE",
                effects: [],
              },
              {
                from: "Matched",
                to: "Matched",
                event: "HINT",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "GridPuzzlePage",
          path: "/grid-puzzle",
          isInitial: true,
          traits: [
            {
              ref: "GridPuzzle",
            },
          ],
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
  name: "std-timer",
  version: "1.0.0",
  description: "Countdown timer with pause and expiry",
  theme: {
    name: "game-puzzle-yellow",
    tokens: {
      colors: {
        primary: "#ca8a04",
        "primary-hover": "#a16207",
        "primary-foreground": "#ffffff",
        accent: "#eab308",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "TimerOrbital",
      entity: {
        name: "TimerData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "remaining",
            type: "number",
            default: 0,
          },
          {
            name: "total",
            type: "number",
            default: 0,
          },
          {
            name: "isRunning",
            type: "boolean",
            default: false,
          },
          {
            name: "isPaused",
            type: "boolean",
            default: false,
          },
        ],
      },
      traits: [
        {
          name: "Timer",
          linkedEntity: "TimerData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Idle",
                isInitial: true,
              },
              {
                name: "Running",
              },
              {
                name: "Paused",
              },
              {
                name: "Expired",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START",
                name: "Start Timer",
                payloadSchema: [
                  {
                    name: "duration",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "PAUSE",
                name: "Pause Timer",
              },
              {
                key: "RESUME",
                name: "Resume Timer",
              },
              {
                key: "EXPIRE",
                name: "Timer Expired",
              },
              {
                key: "RESET",
                name: "Reset Timer",
              },
            ],
            transitions: [
              {
                from: "Idle",
                to: "Idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.remaining", 0],
                  ["set", "@entity.total", 0],
                  ["set", "@entity.isRunning", false],
                  ["set", "@entity.isPaused", false],
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
                                  name: "timer",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Timer",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Idle",
                              variant: "default",
                              icon: "timer",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Remaining",
                              icon: "timer",
                              value: "@entity.remaining",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          max: 100,
                          label: "Time",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Start",
                              icon: "play-circle",
                              variant: "primary",
                              event: "START",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Idle",
                to: "Running",
                event: "START",
                effects: [
                  ["set", "@entity.total", "@payload.duration"],
                  ["set", "@entity.remaining", "@payload.duration"],
                  ["set", "@entity.isRunning", true],
                  ["set", "@entity.isPaused", false],
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
                                  name: "timer",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Timer",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                              icon: "zap",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Remaining",
                              icon: "timer",
                              value: "@entity.remaining",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.remaining",
                          max: "@entity.total",
                          label: "Time Left",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Pause",
                              icon: "pause-circle",
                              variant: "secondary",
                              event: "PAUSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Running",
                to: "Paused",
                event: "PAUSE",
                effects: [
                  ["set", "@entity.isRunning", false],
                  ["set", "@entity.isPaused", true],
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
                                  name: "timer",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Timer",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Paused",
                              variant: "warning",
                              icon: "pause-circle",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Remaining",
                              icon: "timer",
                              value: "@entity.remaining",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.remaining",
                          max: "@entity.total",
                          label: "Paused",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Resume",
                              icon: "play-circle",
                              variant: "primary",
                              event: "RESUME",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Paused",
                to: "Running",
                event: "RESUME",
                effects: [
                  ["set", "@entity.isRunning", true],
                  ["set", "@entity.isPaused", false],
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
                                  name: "timer",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Timer",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Running",
                              variant: "success",
                              icon: "zap",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Remaining",
                              icon: "timer",
                              value: "@entity.remaining",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.remaining",
                          max: "@entity.total",
                          label: "Time Left",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Pause",
                              icon: "pause-circle",
                              variant: "secondary",
                              event: "PAUSE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Running",
                to: "Expired",
                event: "EXPIRE",
                effects: [
                  ["set", "@entity.remaining", 0],
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
                          justify: "center",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "timer",
                              size: "xl",
                            },
                            {
                              type: "typography",
                              variant: "h1",
                              content: "Time Expired",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Duration",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          max: "@entity.total",
                          label: "Expired",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Expired",
                to: "Idle",
                event: "RESET",
                effects: [
                  ["set", "@entity.remaining", 0],
                  ["set", "@entity.total", 0],
                  ["set", "@entity.isRunning", false],
                  ["set", "@entity.isPaused", false],
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
                                  name: "timer",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Timer",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Idle",
                              variant: "default",
                              icon: "timer",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Remaining",
                              icon: "timer",
                              value: "@entity.remaining",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              icon: "target",
                              value: "@entity.total",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: 0,
                          max: 100,
                          label: "Time",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Start",
                              icon: "play-circle",
                              variant: "primary",
                              event: "START",
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
          ticks: [
            {
              name: "Countdown",
              interval: "frame",
              guard: [
                "and",
                ["=", "@state", "Running"],
                [">", "@entity.remaining", 0],
              ],
              effects: [
                [
                  "set",
                  "@entity.remaining",
                  ["-", "@entity.remaining", 1],
                ],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: "TimerPage",
          path: "/timer",
          isInitial: true,
          traits: [
            {
              ref: "Timer",
            },
          ],
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
  name: "std-scoring-chain",
  version: "1.0.0",
  description: "Combo scoring with chain multiplier",
  theme: {
    name: "game-puzzle-yellow",
    tokens: {
      colors: {
        primary: "#ca8a04",
        "primary-hover": "#a16207",
        "primary-foreground": "#ffffff",
        accent: "#eab308",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ScoringChainOrbital",
      entity: {
        name: "ScoringChainData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "chainLength",
            type: "number",
            default: 0,
          },
          {
            name: "multiplier",
            type: "number",
            default: 1,
          },
          {
            name: "totalScore",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "ScoringChain",
          linkedEntity: "ScoringChainData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Idle",
                isInitial: true,
              },
              {
                name: "Chaining",
              },
              {
                name: "Breaking",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "HIT",
                name: "Chain Hit",
                payloadSchema: [
                  {
                    name: "points",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "BREAK",
                name: "Break Chain",
              },
              {
                key: "RESET_SCORE",
                name: "Reset Score",
              },
              {
                key: "RESUME",
                name: "Resume",
              },
            ],
            transitions: [
              {
                from: "Idle",
                to: "Idle",
                event: "INIT",
                effects: [
                  ["set", "@entity.chainLength", 0],
                  ["set", "@entity.multiplier", 1],
                  ["set", "@entity.totalScore", 0],
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
                                  name: "trophy",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Combo Scoring",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "default",
                              icon: "target",
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
                              label: "Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                            {
                              type: "stat-display",
                              label: "Chain",
                              icon: "zap",
                              value: "@entity.chainLength",
                            },
                            {
                              type: "stat-display",
                              label: "Multiplier",
                              icon: "star",
                              value: "@entity.multiplier",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.multiplier",
                          max: 10,
                          label: "Combo Multiplier",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Idle",
                to: "Chaining",
                event: "HIT",
                effects: [
                  ["set", "@entity.chainLength", 1],
                  ["set", "@entity.multiplier", 1],
                  [
                    "set",
                    "@entity.totalScore",
                    ["+", "@entity.totalScore", "@payload.points"],
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
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "zap",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Combo Active!",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Chaining",
                              variant: "success",
                              icon: "zap",
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
                              label: "Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                            {
                              type: "stat-display",
                              label: "Chain",
                              icon: "zap",
                              value: "@entity.chainLength",
                            },
                            {
                              type: "stat-display",
                              label: "Multiplier",
                              icon: "star",
                              value: "@entity.multiplier",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.multiplier",
                          max: 10,
                          label: "Combo Multiplier",
                          icon: "zap",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.chainLength",
                          max: 20,
                          label: "Chain Length",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Chaining",
                to: "Chaining",
                event: "HIT",
                effects: [
                  [
                    "set",
                    "@entity.chainLength",
                    ["+", "@entity.chainLength", 1],
                  ],
                  [
                    "set",
                    "@entity.multiplier",
                    ["+", "@entity.multiplier", 1],
                  ],
                  [
                    "set",
                    "@entity.totalScore",
                    [
                      "+",
                      "@entity.totalScore",
                      ["*", "@payload.points", "@entity.multiplier"],
                    ],
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
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "zap",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Combo Active!",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Chaining",
                              variant: "success",
                              icon: "zap",
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
                              label: "Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                            {
                              type: "stat-display",
                              label: "Chain",
                              icon: "zap",
                              value: "@entity.chainLength",
                            },
                            {
                              type: "stat-display",
                              label: "Multiplier",
                              icon: "star",
                              value: "@entity.multiplier",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.multiplier",
                          max: 10,
                          label: "Combo Multiplier",
                          icon: "zap",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.chainLength",
                          max: 20,
                          label: "Chain Length",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Chaining",
                to: "Breaking",
                event: "BREAK",
                effects: [
                  ["set", "@entity.chainLength", 0],
                  ["set", "@entity.multiplier", 1],
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
                                  name: "target",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Chain Broken",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Broken",
                              variant: "error",
                              icon: "target",
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
                          justify: "center",
                          children: [
                            {
                              type: "stat-display",
                              label: "Total Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: 1,
                          max: 10,
                          label: "Multiplier Reset",
                          icon: "target",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "center",
                          children: [
                            {
                              type: "button",
                              label: "Continue",
                              icon: "refresh-cw",
                              variant: "primary",
                              event: "RESUME",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Breaking",
                to: "Idle",
                event: "RESUME",
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
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "trophy",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Combo Scoring",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "default",
                              icon: "target",
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
                              label: "Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                            {
                              type: "stat-display",
                              label: "Chain",
                              icon: "zap",
                              value: "@entity.chainLength",
                            },
                            {
                              type: "stat-display",
                              label: "Multiplier",
                              icon: "star",
                              value: "@entity.multiplier",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.multiplier",
                          max: 10,
                          label: "Combo Multiplier",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Idle",
                to: "Idle",
                event: "RESET_SCORE",
                effects: [
                  ["set", "@entity.chainLength", 0],
                  ["set", "@entity.multiplier", 1],
                  ["set", "@entity.totalScore", 0],
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
                                  name: "trophy",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Combo Scoring",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "default",
                              icon: "target",
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
                              label: "Score",
                              icon: "trophy",
                              value: "@entity.totalScore",
                            },
                            {
                              type: "stat-display",
                              label: "Chain",
                              icon: "zap",
                              value: "@entity.chainLength",
                            },
                            {
                              type: "stat-display",
                              label: "Multiplier",
                              icon: "star",
                              value: "@entity.multiplier",
                            },
                          ],
                        },
                        {
                          type: "meter",
                          value: "@entity.multiplier",
                          max: 10,
                          label: "Combo Multiplier",
                          icon: "zap",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "game-hud",
                      position: "top",
                      elements: [
                        {
                          label: "Chain",
                          value: "@entity.chainLength",
                          icon: "link",
                        },
                        {
                          label: "Multi",
                          value: "@entity.multiplier",
                          icon: "zap",
                        },
                        {
                          label: "Score",
                          value: "@entity.totalScore",
                          icon: "trophy",
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
          name: "ScoringChainPage",
          path: "/scoring-chain",
          isInitial: true,
          traits: [
            {
              ref: "ScoringChain",
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

export const GAME_2D_PUZZLE_BEHAVIORS: BehaviorSchema[] = [
  GRID_PUZZLE_BEHAVIOR,
  TIMER_BEHAVIOR,
  SCORING_CHAIN_BEHAVIOR,
];
