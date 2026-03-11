/**
 * 2D Strategy Game Behaviors
 *
 * Standard behaviors for 2D strategy games: turn management, unit commands,
 * fog of war, and resource management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: game-first patterns (isometric-canvas, game-hud)
 * replacing stat-card dashboard layouts with proper game components.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ── Shared Strategy Game Theme ──────────────────────────────────────

const STRATEGY_THEME = {
  name: 'game-strategy-emerald',
  tokens: {
    colors: {
      primary: '#059669',
      'primary-hover': '#047857',
      'primary-foreground': '#ffffff',
      accent: '#34d399',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Asset constants ─────────────────────────────────────────────────

const KFLOW_ASSETS = 'https://almadar-kflow-assets.web.app/shared';
const GAME_MANIFEST = {
  terrain: {
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

const TILES_8X6: Array<{ x: number; y: number; terrain: string }> = [];
for (let y = 0; y < 6; y++) {
  for (let x = 0; x < 8; x++) {
    TILES_8X6.push({ x, y, terrain: (x + y) % 3 === 0 ? 'stone' : (x + y) % 3 === 1 ? 'dirt' : 'bridge' });
  }
}

// ============================================================================
// std-turn-system - Turn Management
// ============================================================================

const turnCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [
    { id: 'player1', x: 1, y: 2, unitType: 'guardian' },
    { id: 'player2', x: 5, y: 3, unitType: 'breaker' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const turnHudOverlay: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Turn', value: '@entity.turnNumber', icon: 'layers' },
      { label: 'Player', value: '@entity.currentPlayer', icon: 'users' },
      { label: 'Phase', value: '@entity.phase', icon: 'flag' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Begin Turn', action: 'BEGIN_TURN', icon: 'sword', variant: 'primary' },
      { type: 'button', label: 'End Actions', action: 'END_ACTIONS', icon: 'shield', variant: 'secondary' },
      { type: 'button', label: 'Next Turn', action: 'NEXT_TURN', icon: 'castle', variant: 'secondary' },
    ] },
  ],
}];

/**
 * std-turn-system - Turn-based game cycle management.
 *
 * States: Waiting -> Acting -> Resolving
 * Tracks current player, turn number, and phase.
 */
export const TURN_SYSTEM_BEHAVIOR: BehaviorSchema = {
  name: "std-turn-system",
  version: "1.0.0",
  description: "Turn-based game cycle with phases",
  theme: {
    name: "game-strategy-emerald",
    tokens: {
      colors: {
        primary: "#059669",
        "primary-hover": "#047857",
        "primary-foreground": "#ffffff",
        accent: "#34d399",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "TurnSystemOrbital",
      entity: {
        name: "TurnData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "currentPlayer",
            type: "number",
            default: 1,
          },
          {
            name: "turnNumber",
            type: "number",
            default: 1,
          },
          {
            name: "phase",
            type: "string",
            default: "waiting",
          },
        ],
      },
      traits: [
        {
          name: "TurnSystem",
          linkedEntity: "TurnData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Waiting",
                isInitial: true,
              },
              {
                name: "Acting",
              },
              {
                name: "Resolving",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "BEGIN_TURN",
                name: "Begin Turn",
              },
              {
                key: "END_ACTIONS",
                name: "End Actions",
              },
              {
                key: "RESOLVE",
                name: "Resolve",
              },
              {
                key: "NEXT_TURN",
                name: "Next Turn",
              },
              {
                key: "TILE_CLICK",
                name: "TILE CLICK",
              },
              {
                key: "UNIT_CLICK",
                name: "UNIT CLICK",
              },
              {
                key: "TILE_HOVER",
                name: "TILE HOVER",
              },
              {
                key: "TILE_LEAVE",
                name: "TILE LEAVE",
              },
            ],
            transitions: [
              {
                from: "Waiting",
                to: "Waiting",
                event: "INIT",
                effects: [
                  ["fetch", "TurnData"],
                  ["set", "@entity.currentPlayer", 1],
                  ["set", "@entity.turnNumber", 1],
                  ["set", "@entity.phase", "waiting"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player-unit",
                          x: 1,
                          y: 2,
                          unitType: "guardian",
                        },
                        {
                          id: "enemy-unit-1",
                          x: 4,
                          y: 2,
                          unitType: "breaker",
                        },
                        {
                          id: "enemy-unit-2",
                          x: 4,
                          y: 4,
                          unitType: "breaker",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                        },
                      },
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Turn",
                              value: "@entity.turnNumber",
                              icon: "layers",
                            },
                            {
                              label: "Player",
                              value: "@entity.currentPlayer",
                              icon: "users",
                            },
                            {
                              label: "Phase",
                              value: "@entity.phase",
                              icon: "flag",
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
                              label: "Begin Turn",
                              icon: "sword",
                              variant: "primary",
                              event: "BEGIN_TURN",
                            },
                            {
                              type: "button",
                              label: "End Actions",
                              icon: "shield",
                              variant: "secondary",
                              event: "END_ACTIONS",
                            },
                            {
                              type: "button",
                              label: "Next Turn",
                              icon: "castle",
                              variant: "secondary",
                              event: "NEXT_TURN",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Waiting",
                to: "Acting",
                event: "BEGIN_TURN",
                effects: [
                  ["fetch", "TurnData"],
                  ["set", "@entity.phase", "acting"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player-unit",
                          x: 1,
                          y: 2,
                          unitType: "guardian",
                        },
                        {
                          id: "enemy-unit-1",
                          x: 4,
                          y: 2,
                          unitType: "breaker",
                        },
                        {
                          id: "enemy-unit-2",
                          x: 4,
                          y: 4,
                          unitType: "breaker",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                        },
                      },
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Turn",
                              value: "@entity.turnNumber",
                              icon: "layers",
                            },
                            {
                              label: "Player",
                              value: "@entity.currentPlayer",
                              icon: "users",
                            },
                            {
                              label: "Phase",
                              value: "@entity.phase",
                              icon: "flag",
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
                              label: "Begin Turn",
                              icon: "sword",
                              variant: "primary",
                              event: "BEGIN_TURN",
                            },
                            {
                              type: "button",
                              label: "End Actions",
                              icon: "shield",
                              variant: "secondary",
                              event: "END_ACTIONS",
                            },
                            {
                              type: "button",
                              label: "Next Turn",
                              icon: "castle",
                              variant: "secondary",
                              event: "NEXT_TURN",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Acting",
                to: "Resolving",
                event: "END_ACTIONS",
                effects: [
                  ["fetch", "TurnData"],
                  ["set", "@entity.phase", "resolving"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player-unit",
                          x: 1,
                          y: 2,
                          unitType: "guardian",
                        },
                        {
                          id: "enemy-unit-1",
                          x: 4,
                          y: 2,
                          unitType: "breaker",
                        },
                        {
                          id: "enemy-unit-2",
                          x: 4,
                          y: 4,
                          unitType: "breaker",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                        },
                      },
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Turn",
                              value: "@entity.turnNumber",
                              icon: "layers",
                            },
                            {
                              label: "Player",
                              value: "@entity.currentPlayer",
                              icon: "users",
                            },
                            {
                              label: "Phase",
                              value: "@entity.phase",
                              icon: "flag",
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
                              label: "Begin Turn",
                              icon: "sword",
                              variant: "primary",
                              event: "BEGIN_TURN",
                            },
                            {
                              type: "button",
                              label: "End Actions",
                              icon: "shield",
                              variant: "secondary",
                              event: "END_ACTIONS",
                            },
                            {
                              type: "button",
                              label: "Next Turn",
                              icon: "castle",
                              variant: "secondary",
                              event: "NEXT_TURN",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Resolving",
                to: "Waiting",
                event: "RESOLVE",
                effects: [
                  ["fetch", "TurnData"],
                  ["set", "@entity.phase", "waiting"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player-unit",
                          x: 1,
                          y: 2,
                          unitType: "guardian",
                        },
                        {
                          id: "enemy-unit-1",
                          x: 4,
                          y: 2,
                          unitType: "breaker",
                        },
                        {
                          id: "enemy-unit-2",
                          x: 4,
                          y: 4,
                          unitType: "breaker",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                        },
                      },
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Turn",
                              value: "@entity.turnNumber",
                              icon: "layers",
                            },
                            {
                              label: "Player",
                              value: "@entity.currentPlayer",
                              icon: "users",
                            },
                            {
                              label: "Phase",
                              value: "@entity.phase",
                              icon: "flag",
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
                              label: "Begin Turn",
                              icon: "sword",
                              variant: "primary",
                              event: "BEGIN_TURN",
                            },
                            {
                              type: "button",
                              label: "End Actions",
                              icon: "shield",
                              variant: "secondary",
                              event: "END_ACTIONS",
                            },
                            {
                              type: "button",
                              label: "Next Turn",
                              icon: "castle",
                              variant: "secondary",
                              event: "NEXT_TURN",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Resolving",
                to: "Waiting",
                event: "NEXT_TURN",
                effects: [
                  ["fetch", "TurnData"],
                  [
                    "set",
                    "@entity.turnNumber",
                    ["+", "@entity.turnNumber", 1],
                  ],
                  [
                    "set",
                    "@entity.currentPlayer",
                    [
                      "if",
                      ["=", "@entity.currentPlayer", 1],
                      2,
                      1,
                    ],
                  ],
                  ["set", "@entity.phase", "waiting"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player-unit",
                          x: 1,
                          y: 2,
                          unitType: "guardian",
                        },
                        {
                          id: "enemy-unit-1",
                          x: 4,
                          y: 2,
                          unitType: "breaker",
                        },
                        {
                          id: "enemy-unit-2",
                          x: 4,
                          y: 4,
                          unitType: "breaker",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                        },
                      },
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Turn",
                              value: "@entity.turnNumber",
                              icon: "layers",
                            },
                            {
                              label: "Player",
                              value: "@entity.currentPlayer",
                              icon: "users",
                            },
                            {
                              label: "Phase",
                              value: "@entity.phase",
                              icon: "flag",
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
                              label: "Begin Turn",
                              icon: "sword",
                              variant: "primary",
                              event: "BEGIN_TURN",
                            },
                            {
                              type: "button",
                              label: "End Actions",
                              icon: "shield",
                              variant: "secondary",
                              event: "END_ACTIONS",
                            },
                            {
                              type: "button",
                              label: "Next Turn",
                              icon: "castle",
                              variant: "secondary",
                              event: "NEXT_TURN",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Waiting",
                to: "Waiting",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Waiting",
                to: "Waiting",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Waiting",
                to: "Waiting",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Waiting",
                to: "Waiting",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Acting",
                to: "Acting",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Acting",
                to: "Acting",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Acting",
                to: "Acting",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Acting",
                to: "Acting",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Resolving",
                to: "Resolving",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Resolving",
                to: "Resolving",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Resolving",
                to: "Resolving",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Resolving",
                to: "Resolving",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "TurnSystemPage",
          path: "/turn-system",
          isInitial: true,
          traits: [
            {
              ref: "TurnSystem",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-unit-command - Unit Orders
// ============================================================================

const unitCommandCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [
    { id: 'unit1', x: 2, y: 1, unitType: 'guardian' },
    { id: 'unit2', x: 4, y: 3, unitType: 'breaker' },
    { id: 'unit3', x: 6, y: 2, unitType: 'archivist' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  unitClickEvent: 'SELECT_UNIT',
  tileClickEvent: 'ISSUE_COMMAND',
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const unitCommandHudOverlay: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Unit', value: '@entity.unitId', icon: 'users' },
      { label: 'Command', value: '@entity.commandType', icon: 'map' },
      { label: 'Target X', value: '@entity.targetX', icon: 'target' },
      { label: 'Target Y', value: '@entity.targetY', icon: 'target' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Select Unit', action: 'SELECT_UNIT', icon: 'users', variant: 'primary' },
      { type: 'button', label: 'Issue Command', action: 'ISSUE_COMMAND', icon: 'sword', variant: 'primary' },
      { type: 'button', label: 'Execute', action: 'EXECUTE', icon: 'shield', variant: 'secondary' },
      { type: 'button', label: 'Deselect', action: 'DESELECT', icon: 'target', variant: 'secondary' },
    ] },
  ],
}];

/**
 * std-unit-command - Unit selection and command issuing.
 *
 * States: Idle -> Selected -> Commanding
 * Select a unit and issue movement/attack orders.
 */
export const UNIT_COMMAND_BEHAVIOR: BehaviorSchema = {
  name: "std-unit-command",
  version: "1.0.0",
  description: "Unit selection and command issuing for strategy games",
  theme: {
    name: "game-strategy-emerald",
    tokens: {
      colors: {
        primary: "#059669",
        "primary-hover": "#047857",
        "primary-foreground": "#ffffff",
        accent: "#34d399",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "UnitCommandOrbital",
      entity: {
        name: "UnitCommand",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "unitId",
            type: "string",
            default: "",
          },
          {
            name: "commandType",
            type: "string",
            default: "",
          },
          {
            name: "targetX",
            type: "number",
            default: 0,
          },
          {
            name: "targetY",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "UnitCommander",
          linkedEntity: "UnitCommand",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Idle",
                isInitial: true,
              },
              {
                name: "Selected",
              },
              {
                name: "Commanding",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SELECT_UNIT",
                name: "Select Unit",
                payloadSchema: [
                  {
                    name: "unitId",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "ISSUE_COMMAND",
                name: "Issue Command",
                payloadSchema: [
                  {
                    name: "commandType",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "targetX",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "targetY",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "EXECUTE",
                name: "Execute Command",
              },
              {
                key: "DESELECT",
                name: "Deselect",
              },
              {
                key: "TILE_CLICK",
                name: "TILE CLICK",
              },
              {
                key: "UNIT_CLICK",
                name: "UNIT CLICK",
              },
              {
                key: "TILE_HOVER",
                name: "TILE HOVER",
              },
              {
                key: "TILE_LEAVE",
                name: "TILE LEAVE",
              },
            ],
            transitions: [
              {
                from: "Idle",
                to: "Idle",
                event: "INIT",
                effects: [
                  ["fetch", "UnitCommand"],
                  ["set", "@entity.unitId", ""],
                  ["set", "@entity.commandType", ""],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "unit-1",
                          x: 1,
                          y: 1,
                          unitType: "guardian",
                        },
                        {
                          id: "unit-2",
                          x: 3,
                          y: 1,
                          unitType: "breaker",
                        },
                        {
                          id: "unit-3",
                          x: 5,
                          y: 1,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          battle_marker: "/world-map/battle_marker.png",
                        },
                      },
                      features: [
                        {
                          id: "target-1",
                          x: 2,
                          y: 4,
                          featureType: "battle_marker",
                        },
                        {
                          id: "target-2",
                          x: 4,
                          y: 4,
                          featureType: "battle_marker",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Status",
                              value: "Ready",
                              icon: "shield",
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
                              label: "Select Unit",
                              icon: "users",
                              variant: "primary",
                              event: "SELECT_UNIT",
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
                to: "Selected",
                event: "SELECT_UNIT",
                effects: [
                  ["fetch", "UnitCommand"],
                  ["set", "@entity.unitId", "@payload.unitId"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "unit-1",
                          x: 1,
                          y: 1,
                          unitType: "guardian",
                        },
                        {
                          id: "unit-2",
                          x: 3,
                          y: 1,
                          unitType: "breaker",
                        },
                        {
                          id: "unit-3",
                          x: 5,
                          y: 1,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          battle_marker: "/world-map/battle_marker.png",
                        },
                      },
                      features: [
                        {
                          id: "target-1",
                          x: 2,
                          y: 4,
                          featureType: "battle_marker",
                        },
                        {
                          id: "target-2",
                          x: 4,
                          y: 4,
                          featureType: "battle_marker",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Selected Unit",
                              value: "@entity.unitId",
                              icon: "users",
                            },
                            {
                              label: "Status",
                              value: "Unit Selected",
                              icon: "check-circle",
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
                              label: "Issue Command",
                              icon: "crosshair",
                              variant: "primary",
                              event: "ISSUE_COMMAND",
                            },
                            {
                              type: "button",
                              label: "Deselect",
                              icon: "x",
                              variant: "ghost",
                              event: "DESELECT",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Selected",
                to: "Commanding",
                event: "ISSUE_COMMAND",
                effects: [
                  ["fetch", "UnitCommand"],
                  ["set", "@entity.commandType", "@payload.commandType"],
                  ["set", "@entity.targetX", "@payload.targetX"],
                  ["set", "@entity.targetY", "@payload.targetY"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "unit-1",
                          x: 1,
                          y: 1,
                          unitType: "guardian",
                        },
                        {
                          id: "unit-2",
                          x: 3,
                          y: 1,
                          unitType: "breaker",
                        },
                        {
                          id: "unit-3",
                          x: 5,
                          y: 1,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          battle_marker: "/world-map/battle_marker.png",
                        },
                      },
                      features: [
                        {
                          id: "target-1",
                          x: 2,
                          y: 4,
                          featureType: "battle_marker",
                        },
                        {
                          id: "target-2",
                          x: 4,
                          y: 4,
                          featureType: "battle_marker",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Unit",
                              value: "@entity.unitId",
                              icon: "users",
                            },
                            {
                              label: "Command",
                              value: "@entity.commandType",
                              icon: "crosshair",
                            },
                            {
                              label: "Target X",
                              value: "@entity.targetX",
                              icon: "target",
                            },
                            {
                              label: "Target Y",
                              value: "@entity.targetY",
                              icon: "target",
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
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "EXECUTE",
                            },
                            {
                              type: "button",
                              label: "Deselect",
                              icon: "x",
                              variant: "ghost",
                              event: "DESELECT",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Commanding",
                to: "Idle",
                event: "EXECUTE",
                effects: [
                  ["fetch", "UnitCommand"],
                  ["set", "@entity.unitId", ""],
                  ["set", "@entity.commandType", ""],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "unit-1",
                          x: 1,
                          y: 1,
                          unitType: "guardian",
                        },
                        {
                          id: "unit-2",
                          x: 3,
                          y: 1,
                          unitType: "breaker",
                        },
                        {
                          id: "unit-3",
                          x: 5,
                          y: 1,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          battle_marker: "/world-map/battle_marker.png",
                        },
                      },
                      features: [
                        {
                          id: "target-1",
                          x: 2,
                          y: 4,
                          featureType: "battle_marker",
                        },
                        {
                          id: "target-2",
                          x: 4,
                          y: 4,
                          featureType: "battle_marker",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Status",
                              value: "Ready",
                              icon: "shield",
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
                              label: "Select Unit",
                              icon: "users",
                              variant: "primary",
                              event: "SELECT_UNIT",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Selected",
                to: "Idle",
                event: "DESELECT",
                effects: [
                  ["fetch", "UnitCommand"],
                  ["set", "@entity.unitId", ""],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "unit-1",
                          x: 1,
                          y: 1,
                          unitType: "guardian",
                        },
                        {
                          id: "unit-2",
                          x: 3,
                          y: 1,
                          unitType: "breaker",
                        },
                        {
                          id: "unit-3",
                          x: 5,
                          y: 1,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                          breaker: "/sprite-sheets/breaker-sprite-sheet-se.png",
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          battle_marker: "/world-map/battle_marker.png",
                        },
                      },
                      features: [
                        {
                          id: "target-1",
                          x: 2,
                          y: 4,
                          featureType: "battle_marker",
                        },
                        {
                          id: "target-2",
                          x: 4,
                          y: 4,
                          featureType: "battle_marker",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Status",
                              value: "Ready",
                              icon: "shield",
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
                              label: "Select Unit",
                              icon: "users",
                              variant: "primary",
                              event: "SELECT_UNIT",
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
                to: "Idle",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Idle",
                to: "Idle",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Idle",
                to: "Idle",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Idle",
                to: "Idle",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Selected",
                to: "Selected",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Selected",
                to: "Selected",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Selected",
                to: "Selected",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Selected",
                to: "Selected",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Commanding",
                to: "Commanding",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Commanding",
                to: "Commanding",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Commanding",
                to: "Commanding",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Commanding",
                to: "Commanding",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "UnitCommandPage",
          path: "/unit-command",
          isInitial: true,
          traits: [
            {
              ref: "UnitCommander",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-fog-of-war - Visibility Management
// ============================================================================

const fogCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'scout', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'node', x: 6, y: 4, featureType: 'power_node' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const fogHudOverlay: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Visible', value: '@entity.visibleTiles', icon: 'target' },
      { label: 'Explored', value: '@entity.exploredTiles', icon: 'map' },
      { label: 'Radius', value: '@entity.revealRadius', icon: 'layers' },
    ] },
    { type: 'progress-bar', value: '@entity.visibleTiles', max: '@entity.exploredTiles', label: 'Visibility Coverage' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Reveal Area', action: 'REVEAL', icon: 'target', variant: 'primary' },
      { type: 'button', label: 'Explore', action: 'EXPLORE', icon: 'map', variant: 'primary' },
      { type: 'button', label: 'Reveal All', action: 'REVEAL_ALL', icon: 'layers', variant: 'secondary' },
      { type: 'button', label: 'Reset Fog', action: 'RESET_FOG', icon: 'shield', variant: 'secondary' },
    ] },
  ],
}];

/**
 * std-fog-of-war - Map visibility and exploration tracking.
 *
 * States: Hidden -> Partial -> Revealed
 * Tracks visible tiles, explored tiles, and reveal radius.
 */
export const FOG_OF_WAR_BEHAVIOR: BehaviorSchema = {
  name: "std-fog-of-war",
  version: "1.0.0",
  description: "Map visibility and fog of war management",
  theme: {
    name: "game-strategy-emerald",
    tokens: {
      colors: {
        primary: "#059669",
        "primary-hover": "#047857",
        "primary-foreground": "#ffffff",
        accent: "#34d399",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "FogOfWarOrbital",
      entity: {
        name: "FogData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "visibleTiles",
            type: "number",
            default: 0,
          },
          {
            name: "exploredTiles",
            type: "number",
            default: 0,
          },
          {
            name: "revealRadius",
            type: "number",
            default: 3,
          },
        ],
      },
      traits: [
        {
          name: "FogOfWar",
          linkedEntity: "FogData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Hidden",
                isInitial: true,
              },
              {
                name: "Partial",
              },
              {
                name: "Revealed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "REVEAL",
                name: "Reveal Area",
                payloadSchema: [
                  {
                    name: "tiles",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "EXPLORE",
                name: "Explore",
              },
              {
                key: "REVEAL_ALL",
                name: "Reveal All",
              },
              {
                key: "RESET_FOG",
                name: "Reset Fog",
              },
              {
                key: "TILE_CLICK",
                name: "TILE CLICK",
              },
              {
                key: "UNIT_CLICK",
                name: "UNIT CLICK",
              },
              {
                key: "TILE_HOVER",
                name: "TILE HOVER",
              },
              {
                key: "TILE_LEAVE",
                name: "TILE LEAVE",
              },
            ],
            transitions: [
              {
                from: "Hidden",
                to: "Hidden",
                event: "INIT",
                effects: [
                  ["fetch", "FogData"],
                  ["set", "@entity.visibleTiles", 0],
                  ["set", "@entity.exploredTiles", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Hidden",
                to: "Partial",
                event: "REVEAL",
                effects: [
                  ["fetch", "FogData"],
                  ["set", "@entity.visibleTiles", "@payload.tiles"],
                  ["set", "@entity.exploredTiles", "@payload.tiles"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "REVEAL",
                effects: [
                  ["fetch", "FogData"],
                  ["set", "@entity.visibleTiles", "@payload.tiles"],
                  [
                    "set",
                    "@entity.exploredTiles",
                    ["+", "@entity.exploredTiles", "@payload.tiles"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "EXPLORE",
                effects: [
                  ["fetch", "FogData"],
                  [
                    "set",
                    "@entity.exploredTiles",
                    ["+", "@entity.exploredTiles", "@entity.revealRadius"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Partial",
                to: "Revealed",
                event: "REVEAL_ALL",
                effects: [
                  ["fetch", "FogData"],
                  ["set", "@entity.visibleTiles", "@entity.exploredTiles"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Revealed",
                to: "Hidden",
                event: "RESET_FOG",
                effects: [
                  ["fetch", "FogData"],
                  ["set", "@entity.visibleTiles", 0],
                  ["set", "@entity.exploredTiles", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "isometric-canvas",
                      tiles: [
                        {
                          x: 0,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 0,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 1,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 2,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "bridge",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 3,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 4,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 5,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "grass",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "dirt",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "grass",
                        },
                      ],
                      units: [
                        {
                          id: "explorer",
                          x: 4,
                          y: 4,
                          unitType: "archivist",
                        },
                      ],
                      scale: 0.4,
                      boardWidth: 8,
                      boardHeight: 8,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrain: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "hidden-treasure",
                          x: 1,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "hidden-portal",
                          x: 7,
                          y: 7,
                          featureType: "portal",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Visible",
                              value: "@entity.visibleTiles",
                              icon: "target",
                            },
                            {
                              label: "Explored",
                              value: "@entity.exploredTiles",
                              icon: "map",
                            },
                            {
                              label: "Radius",
                              value: "@entity.revealRadius",
                              icon: "layers",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.visibleTiles",
                          max: "@entity.exploredTiles",
                          label: "Visibility Coverage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Reveal Area",
                              icon: "target",
                              variant: "primary",
                              event: "REVEAL",
                            },
                            {
                              type: "button",
                              label: "Explore",
                              icon: "map",
                              variant: "primary",
                              event: "EXPLORE",
                            },
                            {
                              type: "button",
                              label: "Reveal All",
                              icon: "layers",
                              variant: "secondary",
                              event: "REVEAL_ALL",
                            },
                            {
                              type: "button",
                              label: "Reset Fog",
                              icon: "shield",
                              variant: "secondary",
                              event: "RESET_FOG",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Hidden",
                to: "Hidden",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Hidden",
                to: "Hidden",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Hidden",
                to: "Hidden",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Hidden",
                to: "Hidden",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Partial",
                to: "Partial",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Revealed",
                to: "Revealed",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Revealed",
                to: "Revealed",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Revealed",
                to: "Revealed",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Revealed",
                to: "Revealed",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "FogOfWarPage",
          path: "/fog-of-war",
          isInitial: true,
          traits: [
            {
              ref: "FogOfWar",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-resource - Resource Management
// ============================================================================

const resourceCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'gatherer', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'node', x: 6, y: 4, featureType: 'power_node' },
    { id: 'chest', x: 4, y: 0, featureType: 'treasure' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const resourceHudOverlay: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Gold', value: '@entity.gold', icon: 'coins' },
      { label: 'Wood', value: '@entity.wood', icon: 'layers' },
      { label: 'Stone', value: '@entity.stone', icon: 'castle' },
      { label: 'Food', value: '@entity.food', icon: 'shield' },
    ] },
    { type: 'progress-bar', value: '@entity.gold', max: '@entity.capacity', label: 'Gold Capacity' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Gather', action: 'GATHER', icon: 'coins', variant: 'primary' },
      { type: 'button', label: 'Spend', action: 'SPEND', icon: 'sword', variant: 'secondary' },
      { type: 'button', label: 'Check Status', action: 'CHECK_STATUS', icon: 'flag', variant: 'secondary' },
    ] },
  ],
}];

/**
 * std-resource - Strategy game resource tracking.
 *
 * States: Stable -> Surplus -> Deficit
 * Tracks gold, wood, stone, food, and capacity.
 */
export const RESOURCE_BEHAVIOR: BehaviorSchema = {
  name: "std-resource",
  version: "1.0.0",
  description: "Strategy game resource management",
  theme: {
    name: "game-strategy-emerald",
    tokens: {
      colors: {
        primary: "#059669",
        "primary-hover": "#047857",
        "primary-foreground": "#ffffff",
        accent: "#34d399",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "ResourceOrbital",
      entity: {
        name: "ResourceData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "gold",
            type: "number",
            default: 100,
          },
          {
            name: "wood",
            type: "number",
            default: 50,
          },
          {
            name: "stone",
            type: "number",
            default: 30,
          },
          {
            name: "food",
            type: "number",
            default: 80,
          },
          {
            name: "capacity",
            type: "number",
            default: 500,
          },
        ],
      },
      traits: [
        {
          name: "ResourceManager",
          linkedEntity: "ResourceData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Stable",
                isInitial: true,
              },
              {
                name: "Surplus",
              },
              {
                name: "Deficit",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "GATHER",
                name: "Gather Resources",
                payloadSchema: [
                  {
                    name: "amount",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "SPEND",
                name: "Spend Resources",
                payloadSchema: [
                  {
                    name: "amount",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "CHECK_STATUS",
                name: "Check Status",
              },
              {
                key: "STABILIZE",
                name: "Stabilize",
              },
            ],
            transitions: [
              {
                from: "Stable",
                to: "Stable",
                event: "INIT",
                effects: [
                  ["set", "@entity.gold", 100],
                  ["set", "@entity.wood", 50],
                  ["set", "@entity.stone", 30],
                  ["set", "@entity.food", 80],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Stable",
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
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Check Status",
                              icon: "flag",
                              variant: "secondary",
                              event: "CHECK_STATUS",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stable",
                to: "Stable",
                event: "GATHER",
                effects: [
                  [
                    "set",
                    "@entity.gold",
                    ["+", "@entity.gold", "@payload.amount"],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Stable",
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
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Check Status",
                              icon: "flag",
                              variant: "secondary",
                              event: "CHECK_STATUS",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stable",
                to: "Stable",
                event: "SPEND",
                guard: [">=", "@entity.gold", "@payload.amount"],
                effects: [
                  [
                    "set",
                    "@entity.gold",
                    ["-", "@entity.gold", "@payload.amount"],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Stable",
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
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Check Status",
                              icon: "flag",
                              variant: "secondary",
                              event: "CHECK_STATUS",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stable",
                to: "Surplus",
                event: "CHECK_STATUS",
                guard: [">", "@entity.gold", "@entity.capacity"],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Surplus",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Gold reserves exceed storage capacity. Consider spending or trading excess resources.",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity (Overflowing)",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Stabilize",
                              icon: "check",
                              variant: "primary",
                              event: "STABILIZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stable",
                to: "Deficit",
                event: "CHECK_STATUS",
                guard: ["<", "@entity.food", 10],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Deficit",
                              variant: "error",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Food supplies critically low. Gather food immediately to avoid famine.",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.food",
                          max: "@entity.capacity",
                          label: "Food Reserves (Critical)",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Stabilize",
                              icon: "check",
                              variant: "primary",
                              event: "STABILIZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Surplus",
                to: "Stable",
                event: "STABILIZE",
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Stable",
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
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Check Status",
                              icon: "flag",
                              variant: "secondary",
                              event: "CHECK_STATUS",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Deficit",
                to: "Stable",
                event: "STABILIZE",
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Stable",
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
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Check Status",
                              icon: "flag",
                              variant: "secondary",
                              event: "CHECK_STATUS",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Surplus",
                to: "Surplus",
                event: "GATHER",
                effects: [
                  [
                    "set",
                    "@entity.gold",
                    ["+", "@entity.gold", "@payload.amount"],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Surplus",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Gold reserves exceed storage capacity. Consider spending or trading excess resources.",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.gold",
                          max: "@entity.capacity",
                          label: "Storage Capacity (Overflowing)",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Spend",
                              icon: "sword",
                              variant: "secondary",
                              event: "SPEND",
                            },
                            {
                              type: "button",
                              label: "Stabilize",
                              icon: "check",
                              variant: "primary",
                              event: "STABILIZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Deficit",
                to: "Deficit",
                event: "GATHER",
                effects: [
                  [
                    "set",
                    "@entity.gold",
                    ["+", "@entity.gold", "@payload.amount"],
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
                          gap: "md",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "coins",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Resource Management",
                            },
                            {
                              type: "badge",
                              label: "Deficit",
                              variant: "error",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Food supplies critically low. Gather food immediately to avoid famine.",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Gold",
                              value: "@entity.gold",
                              icon: "coins",
                            },
                            {
                              type: "stat-display",
                              label: "Wood",
                              value: "@entity.wood",
                              icon: "layers",
                            },
                            {
                              type: "stat-display",
                              label: "Stone",
                              value: "@entity.stone",
                              icon: "castle",
                            },
                            {
                              type: "stat-display",
                              label: "Food",
                              value: "@entity.food",
                              icon: "shield",
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.food",
                          max: "@entity.capacity",
                          label: "Food Reserves (Critical)",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Gather",
                              icon: "coins",
                              variant: "primary",
                              event: "GATHER",
                            },
                            {
                              type: "button",
                              label: "Stabilize",
                              icon: "check",
                              variant: "primary",
                              event: "STABILIZE",
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
          name: "ResourcePage",
          path: "/resource",
          isInitial: true,
          traits: [
            {
              ref: "ResourceManager",
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

export const GAME_2D_STRATEGY_BEHAVIORS: BehaviorSchema[] = [
  TURN_SYSTEM_BEHAVIOR,
  UNIT_COMMAND_BEHAVIOR,
  FOG_OF_WAR_BEHAVIOR,
  RESOURCE_BEHAVIOR,
];
