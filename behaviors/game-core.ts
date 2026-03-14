/**
 * Game Core Behaviors
 *
 * Foundation behaviors for game systems: loop, physics, input, collision.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ============================================================================
// Shared theme for all game-core behaviors
// ============================================================================

const GAME_CORE_THEME = {
  name: 'game-core-cyan',
  tokens: {
    colors: {
      primary: '#0891b2',
      'primary-hover': '#0e7490',
      'primary-foreground': '#ffffff',
      accent: '#06b6d4',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// Shared asset constants
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
  },
  features: {
    gold_mine: '/world-map/gold_mine.png',
    portal: '/world-map/portal_open.png',
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

// --- std-gameloop views ---

const gameLoopCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'player', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
  tileClickEvent: 'START',
}];

const gameLoopHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Frame', value: '@entity.frameCount', icon: 'hash' },
      { label: 'Delta', value: '@entity.deltaTime', icon: 'clock' },
      { label: 'Elapsed', value: '@entity.elapsedTime', icon: 'timer' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Start', action: 'START', icon: 'play', variant: 'primary' },
      { type: 'button', label: 'Pause', action: 'PAUSE', icon: 'pause', variant: 'secondary' },
      { type: 'button', label: 'Stop', action: 'STOP', icon: 'square', variant: 'destructive' },
    ] },
  ],
}];

// --- std-physics2d views ---

const physicsCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'simulation-canvas',
  preset: 'projectile',
  running: true,
  width: 600,
  height: 400,
}];

const physicsHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'badge', label: 'X', value: '@entity.x', icon: 'move-horizontal' },
      { type: 'badge', label: 'Y', value: '@entity.y', icon: 'move-vertical' },
      { type: 'badge', label: 'VX', value: '@entity.vx', icon: 'arrow-right' },
      { type: 'badge', label: 'VY', value: '@entity.vy', icon: 'arrow-down' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Apply Force', action: 'APPLY_FORCE', icon: 'zap', variant: 'primary' },
      { type: 'button', label: 'Freeze', action: 'FREEZE', icon: 'snowflake', variant: 'secondary' },
    ] },
  ],
}];

const physicsFrozenCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'simulation-canvas',
  preset: 'projectile',
  running: false,
  width: 600,
  height: 400,
}];

const physicsFrozenHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'badge', label: 'X', value: '@entity.x', icon: 'move-horizontal' },
      { type: 'badge', label: 'Y', value: '@entity.y', icon: 'move-vertical' },
      { type: 'badge', label: 'VX', value: '@entity.vx', icon: 'arrow-right' },
      { type: 'badge', label: 'VY', value: '@entity.vy', icon: 'arrow-down' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Unfreeze', action: 'UNFREEZE', icon: 'flame', variant: 'primary' },
    ] },
  ],
}];

// --- std-input views ---

const inputCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'cursor', x: 2, y: 2, unitType: 'breaker' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const inputHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'badge', label: 'Key Down', value: '@entity.lastKeyDown', icon: 'arrow-down-circle' },
      { type: 'badge', label: 'Key Up', value: '@entity.lastKeyUp', icon: 'arrow-up-circle' },
      { type: 'badge', label: 'Active', value: '@entity.isActive', icon: 'activity' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Reset', action: 'RESET', icon: 'rotate-ccw', variant: 'secondary' },
    ] },
  ],
}];

// --- std-collision views ---

const collisionCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const collisionHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'badge', label: 'Colliding', value: '@entity.isColliding', icon: 'alert-triangle' },
      { type: 'badge', label: 'Last Hit', value: '@entity.lastCollisionId', icon: 'target' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Clear', action: 'CLEAR', icon: 'x-circle', variant: 'secondary' },
      { type: 'button', label: 'Disable', action: 'DISABLE', icon: 'circle-off', variant: 'destructive' },
    ] },
  ],
}];

const collisionHitEffectView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'canvas-effect',
  actionType: 'hit',
  x: 200,
  y: 200,
  duration: 600,
}];

const collisionDisabledCanvasView: BehaviorEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const collisionDisabledHudView: BehaviorEffect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'badge', label: 'Colliding', value: '@entity.isColliding', icon: 'alert-triangle' },
      { type: 'badge', label: 'Last Hit', value: '@entity.lastCollisionId', icon: 'target' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Enable', action: 'ENABLE', icon: 'circle-dot', variant: 'primary' },
    ] },
  ],
}];

// ============================================================================
// std-gameloop - Master Game Tick Coordination
// ============================================================================

/**
 * std-gameloop - Coordinates game tick execution at 60fps.
 *
 * States: Stopped -> Running -> Paused
 * Provides the master clock for all game systems.
 * Uses a concrete GameLoopData entity to track frame count and elapsed time.
 */
export const GAME_LOOP_BEHAVIOR: BehaviorSchema = {
  name: "std-gameloop",
  version: "1.0.0",
  description: "Master game loop coordinator running at 60fps",
  orbitals: [
    {
      name: "GameLoopOrbital",
      theme: {
        name: "game-core-cyan",
        tokens: {
          colors: {
            primary: "#0891b2",
            "primary-hover": "#0e7490",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "GameLoopData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "frameCount",
            type: "number",
            default: 0,
          },
          {
            name: "deltaTime",
            type: "number",
            default: 16,
          },
          {
            name: "elapsedTime",
            type: "number",
            default: 0,
          },
          {
            name: "status",
            type: "string",
            default: "stopped",
          },
        ],
      },
      traits: [
        {
          name: "GameLoop",
          linkedEntity: "GameLoopData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Stopped",
                isInitial: true,
              },
              {
                name: "Running",
              },
              {
                name: "Paused",
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
                key: "STOP",
                name: "Stop",
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
                from: "Stopped",
                to: "Stopped",
                event: "INIT",
                effects: [
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.frameCount", 0],
                  ["set", "@entity.elapsedTime", 0],
                  ["set", "@entity.status", "stopped"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stopped",
                to: "Running",
                event: "START",
                effects: [
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.frameCount", 0],
                  ["set", "@entity.elapsedTime", 0],
                  ["set", "@entity.status", "running"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
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
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.status", "paused"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
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
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.status", "running"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
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
                to: "Stopped",
                event: "STOP",
                effects: [
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.status", "stopped"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
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
                to: "Stopped",
                event: "STOP",
                effects: [
                  ["fetch", "GameLoopData"],
                  ["set", "@entity.status", "stopped"],
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
                          terrain: "grass",
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
                      ],
                      units: [
                        {
                          id: "player",
                          x: 3,
                          y: 3,
                          unitType: "guardian",
                        },
                      ],
                      scale: 0.5,
                      boardWidth: 6,
                      boardHeight: 6,
                      enableCamera: true,
                      assetBaseUrl: "https://almadar-kflow-assets.web.app/shared",
                      assetManifest: {
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          portal: "/world-map/portal_open.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "spawn",
                          x: 1,
                          y: 1,
                          featureType: "portal",
                        },
                        {
                          id: "goal",
                          x: 5,
                          y: 5,
                          featureType: "treasure",
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
                      gap: "sm",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "Frame",
                              value: "@entity.frameCount",
                              icon: "hash",
                            },
                            {
                              label: "Delta",
                              value: "@entity.deltaTime",
                              icon: "clock",
                            },
                            {
                              label: "Elapsed",
                              value: "@entity.elapsedTime",
                              icon: "timer",
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
                              label: "Start",
                              icon: "play",
                              variant: "primary",
                              event: "START",
                            },
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
                              variant: "destructive",
                              event: "STOP",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stopped",
                to: "Stopped",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Stopped",
                to: "Stopped",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Stopped",
                to: "Stopped",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Stopped",
                to: "Stopped",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Running",
                to: "Running",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Running",
                to: "Running",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Running",
                to: "Running",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Running",
                to: "Running",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Paused",
                to: "Paused",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Paused",
                to: "Paused",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Paused",
                to: "Paused",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Paused",
                to: "Paused",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
          ticks: [
            {
              name: "GameTick",
              interval: "frame",
              guard: ["=", "@state", "Running"],
              effects: [
                [
                  "set",
                  "@entity.frameCount",
                  ["+", "@entity.frameCount", 1],
                ],
                [
                  "set",
                  "@entity.elapsedTime",
                  ["+", "@entity.elapsedTime", "@entity.deltaTime"],
                ],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: "GameLoopPage",
          path: "/game-loop",
          isInitial: true,
          traits: [
            {
              ref: "GameLoop",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-physics2d - Gravity and Velocity
// ============================================================================

/**
 * std-physics2d - 2D physics with gravity, velocity, and friction.
 *
 * Applied to entities that need physics simulation.
 * Uses a concrete Physics2DData entity to track position and velocity.
 */
export const PHYSICS_2D_BEHAVIOR: BehaviorSchema = {
  name: "std-physics2d",
  version: "1.0.0",
  description: "2D physics with gravity, velocity, and friction",
  orbitals: [
    {
      name: "Physics2DOrbital",
      theme: {
        name: "game-core-cyan",
        tokens: {
          colors: {
            primary: "#0891b2",
            "primary-hover": "#0e7490",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "Physics2DData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
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
            name: "vx",
            type: "number",
            default: 0,
          },
          {
            name: "vy",
            type: "number",
            default: 0,
          },
          {
            name: "fx",
            type: "number",
            default: 0,
          },
          {
            name: "fy",
            type: "number",
            default: 0,
          },
          {
            name: "isGrounded",
            type: "boolean",
            default: false,
          },
          {
            name: "gravity",
            type: "number",
            default: 0.5,
          },
          {
            name: "friction",
            type: "number",
            default: 0.8,
          },
          {
            name: "airResistance",
            type: "number",
            default: 0.99,
          },
          {
            name: "maxVelocityY",
            type: "number",
            default: 20,
          },
        ],
      },
      traits: [
        {
          name: "Physics2D",
          linkedEntity: "Physics2DData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Active",
                isInitial: true,
              },
              {
                name: "Frozen",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "APPLY_FORCE",
                name: "Apply Force",
                payloadSchema: [
                  {
                    name: "fx",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "fy",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "GROUND_HIT",
                name: "Ground Hit",
              },
              {
                key: "FREEZE",
                name: "Freeze",
              },
              {
                key: "UNFREEZE",
                name: "Unfreeze",
              },
            ],
            transitions: [
              {
                from: "Active",
                to: "Active",
                event: "INIT",
                effects: [
                  ["fetch", "Physics2DData"],
                  ["set", "@entity.vx", 0],
                  ["set", "@entity.vy", 0],
                  ["set", "@entity.isGrounded", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: true,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Apply Force",
                              icon: "zap",
                              variant: "primary",
                              event: "APPLY_FORCE",
                            },
                            {
                              type: "button",
                              label: "Freeze",
                              icon: "snowflake",
                              variant: "secondary",
                              event: "FREEZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Frozen",
                to: "Active",
                event: "INIT",
                effects: [
                  ["fetch", "Physics2DData"],
                  ["set", "@entity.vx", 0],
                  ["set", "@entity.vy", 0],
                  ["set", "@entity.isGrounded", false],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: true,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Apply Force",
                              icon: "zap",
                              variant: "primary",
                              event: "APPLY_FORCE",
                            },
                            {
                              type: "button",
                              label: "Freeze",
                              icon: "snowflake",
                              variant: "secondary",
                              event: "FREEZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "APPLY_FORCE",
                effects: [
                  ["fetch", "Physics2DData"],
                  [
                    "set",
                    "@entity.vx",
                    ["+", "@entity.vx", "@payload.fx"],
                  ],
                  [
                    "set",
                    "@entity.vy",
                    ["+", "@entity.vy", "@payload.fy"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: true,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Apply Force",
                              icon: "zap",
                              variant: "primary",
                              event: "APPLY_FORCE",
                            },
                            {
                              type: "button",
                              label: "Freeze",
                              icon: "snowflake",
                              variant: "secondary",
                              event: "FREEZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "GROUND_HIT",
                effects: [
                  ["fetch", "Physics2DData"],
                  ["set", "@entity.isGrounded", true],
                  ["set", "@entity.vy", 0],
                  [
                    "set",
                    "@entity.vx",
                    ["*", "@entity.vx", "@entity.friction"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: true,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Apply Force",
                              icon: "zap",
                              variant: "primary",
                              event: "APPLY_FORCE",
                            },
                            {
                              type: "button",
                              label: "Freeze",
                              icon: "snowflake",
                              variant: "secondary",
                              event: "FREEZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Frozen",
                event: "FREEZE",
                effects: [
                  ["fetch", "Physics2DData"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: false,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Unfreeze",
                              icon: "flame",
                              variant: "primary",
                              event: "UNFREEZE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Frozen",
                to: "Active",
                event: "UNFREEZE",
                effects: [
                  ["fetch", "Physics2DData"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "simulation-canvas",
                      preset: "projectile",
                      running: true,
                      width: 600,
                      height: 400,
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "sm",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "X",
                              amount: "@entity.x",
                              icon: "move-horizontal",
                            },
                            {
                              type: "badge",
                              label: "Y",
                              amount: "@entity.y",
                              icon: "move-vertical",
                            },
                            {
                              type: "badge",
                              label: "VX",
                              amount: "@entity.vx",
                              icon: "arrow-right",
                            },
                            {
                              type: "badge",
                              label: "VY",
                              amount: "@entity.vy",
                              icon: "arrow-down",
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
                              label: "Apply Force",
                              icon: "zap",
                              variant: "primary",
                              event: "APPLY_FORCE",
                            },
                            {
                              type: "button",
                              label: "Freeze",
                              icon: "snowflake",
                              variant: "secondary",
                              event: "FREEZE",
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
              name: "ApplyGravity",
              interval: "frame",
              guard: [
                "and",
                ["=", "@state", "Active"],
                ["not", "@entity.isGrounded"],
              ],
              effects: [
                [
                  "set",
                  "@entity.vy",
                  [
                    "math/min",
                    "@entity.maxVelocityY",
                    ["+", "@entity.vy", "@entity.gravity"],
                  ],
                ],
              ],
            },
            {
              name: "ApplyVelocity",
              interval: "frame",
              guard: ["=", "@state", "Active"],
              effects: [
                [
                  "set",
                  "@entity.vx",
                  ["*", "@entity.vx", "@entity.airResistance"],
                ],
                [
                  "set",
                  "@entity.x",
                  ["+", "@entity.x", "@entity.vx"],
                ],
                [
                  "set",
                  "@entity.y",
                  ["+", "@entity.y", "@entity.vy"],
                ],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: "PhysicsPage",
          path: "/physics",
          isInitial: true,
          traits: [
            {
              ref: "Physics2D",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-input - Unified Input State
// ============================================================================

/**
 * std-input - Manages keyboard and touch input state.
 *
 * Singleton behavior that tracks all input state.
 * Simplified to track last key pressed/released as strings
 * rather than mapping individual keys via conditionals.
 */
export const INPUT_BEHAVIOR: BehaviorSchema = {
  name: "std-input",
  version: "1.0.0",
  description: "Unified keyboard and touch input state management",
  orbitals: [
    {
      name: "InputOrbital",
      theme: {
        name: "game-core-cyan",
        tokens: {
          colors: {
            primary: "#0891b2",
            "primary-hover": "#0e7490",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "InputData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "lastKeyDown",
            type: "string",
            default: "",
          },
          {
            name: "lastKeyUp",
            type: "string",
            default: "",
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
          name: "Input",
          linkedEntity: "InputData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Ready",
                isInitial: true,
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "KEY_DOWN",
                name: "Key Down",
                payloadSchema: [
                  {
                    name: "key",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "KEY_UP",
                name: "Key Up",
                payloadSchema: [
                  {
                    name: "key",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "RESET",
                name: "Reset",
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
                from: "Ready",
                to: "Ready",
                event: "INIT",
                effects: [
                  ["fetch", "InputData"],
                  ["set", "@entity.lastKeyDown", ""],
                  ["set", "@entity.lastKeyUp", ""],
                  ["set", "@entity.isActive", true],
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
                              name: "gamepad-2",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              text: "Input System",
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "d-pad",
                          upEvent: "KEY_DOWN",
                          downEvent: "KEY_DOWN",
                          leftEvent: "KEY_DOWN",
                          rightEvent: "KEY_DOWN",
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
                              label: "Last Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Last Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "badge",
                              label: "Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                            {
                              type: "badge",
                              label: "Active",
                              value: "@entity.isActive",
                              icon: "activity",
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
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "secondary",
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
                from: "Ready",
                to: "Ready",
                event: "KEY_DOWN",
                effects: [
                  ["fetch", "InputData"],
                  ["set", "@entity.lastKeyDown", "@payload.key"],
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
                              name: "gamepad-2",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              text: "Input System",
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "d-pad",
                          upEvent: "KEY_DOWN",
                          downEvent: "KEY_DOWN",
                          leftEvent: "KEY_DOWN",
                          rightEvent: "KEY_DOWN",
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
                              label: "Last Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Last Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "badge",
                              label: "Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                            {
                              type: "badge",
                              label: "Active",
                              value: "@entity.isActive",
                              icon: "activity",
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
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "secondary",
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
                from: "Ready",
                to: "Ready",
                event: "KEY_UP",
                effects: [
                  ["fetch", "InputData"],
                  ["set", "@entity.lastKeyUp", "@payload.key"],
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
                              name: "gamepad-2",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              text: "Input System",
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "d-pad",
                          upEvent: "KEY_DOWN",
                          downEvent: "KEY_DOWN",
                          leftEvent: "KEY_DOWN",
                          rightEvent: "KEY_DOWN",
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
                              label: "Last Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Last Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "badge",
                              label: "Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                            {
                              type: "badge",
                              label: "Active",
                              value: "@entity.isActive",
                              icon: "activity",
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
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "secondary",
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
                from: "Ready",
                to: "Ready",
                event: "RESET",
                effects: [
                  ["fetch", "InputData"],
                  ["set", "@entity.lastKeyDown", ""],
                  ["set", "@entity.lastKeyUp", ""],
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
                              name: "gamepad-2",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              text: "Input System",
                            },
                            {
                              type: "badge",
                              label: "Ready",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "d-pad",
                          upEvent: "KEY_DOWN",
                          downEvent: "KEY_DOWN",
                          leftEvent: "KEY_DOWN",
                          rightEvent: "KEY_DOWN",
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
                              label: "Last Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Last Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                          ],
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "badge",
                              label: "Key Down",
                              value: "@entity.lastKeyDown",
                              icon: "arrow-down-circle",
                            },
                            {
                              type: "badge",
                              label: "Key Up",
                              value: "@entity.lastKeyUp",
                              icon: "arrow-up-circle",
                            },
                            {
                              type: "badge",
                              label: "Active",
                              value: "@entity.isActive",
                              icon: "activity",
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
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "secondary",
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
                from: "Ready",
                to: "Ready",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Ready",
                to: "Ready",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Ready",
                to: "Ready",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Ready",
                to: "Ready",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "InputPage",
          path: "/input",
          isInitial: true,
          traits: [
            {
              ref: "Input",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-collision - Collision Detection & Response
// ============================================================================

/**
 * std-collision - Handles collision detection and response.
 *
 * Configures how an entity responds to collisions.
 * Uses a concrete CollisionData entity to track collision status.
 */
export const COLLISION_BEHAVIOR: BehaviorSchema = {
  name: "std-collision",
  version: "1.0.0",
  description: "Collision detection and response configuration",
  orbitals: [
    {
      name: "CollisionOrbital",
      theme: {
        name: "game-core-cyan",
        tokens: {
          colors: {
            primary: "#0891b2",
            "primary-hover": "#0e7490",
            "primary-foreground": "#ffffff",
            accent: "#06b6d4",
            "accent-foreground": "#000000",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "CollisionData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "isColliding",
            type: "boolean",
            default: false,
          },
          {
            name: "lastCollisionId",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "Collision",
          linkedEntity: "CollisionData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Active",
                isInitial: true,
              },
              {
                name: "Disabled",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "COLLISION",
                name: "Collision",
                payloadSchema: [
                  {
                    name: "entityId",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLEAR",
                name: "Clear Collision",
              },
              {
                key: "ENABLE",
                name: "Enable",
              },
              {
                key: "DISABLE",
                name: "Disable",
              },
            ],
            transitions: [
              {
                from: "Active",
                to: "Active",
                event: "INIT",
                effects: [
                  ["fetch", "CollisionData"],
                  ["set", "@entity.isColliding", false],
                  ["set", "@entity.lastCollisionId", ""],
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
                              name: "crosshair",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              text: "Collision System",
                              variant: "h3",
                            },
                            {
                              type: "badge",
                              label: "Active",
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
                              label: "Entity ID",
                              value: "@entity.id",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Last Collision",
                              value: "@entity.lastCollisionId",
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
                              type: "badge",
                              label: "Colliding",
                              value: "@entity.isColliding",
                              icon: "alert-triangle",
                            },
                            {
                              type: "badge",
                              label: "Last Hit",
                              value: "@entity.lastCollisionId",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Test Collision",
                              icon: "zap",
                              variant: "primary",
                              event: "COLLISION",
                              payload: {
                                entityId: "test-object",
                              },
                            },
                            {
                              type: "button",
                              label: "Clear",
                              icon: "x-circle",
                              variant: "secondary",
                              event: "CLEAR",
                            },
                            {
                              type: "button",
                              label: "Disable",
                              icon: "circle-off",
                              variant: "destructive",
                              event: "DISABLE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "COLLISION",
                effects: [
                  ["fetch", "CollisionData"],
                  ["set", "@entity.isColliding", true],
                  ["set", "@entity.lastCollisionId", "@payload.entityId"],
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
                              name: "crosshair",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              text: "Collision System",
                              variant: "h3",
                            },
                            {
                              type: "badge",
                              label: "Collision Detected",
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
                              label: "Entity ID",
                              value: "@entity.id",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Collided With",
                              value: "@entity.lastCollisionId",
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
                              type: "badge",
                              label: "Colliding",
                              value: "@entity.isColliding",
                              icon: "alert-triangle",
                            },
                            {
                              type: "badge",
                              label: "Last Hit",
                              value: "@entity.lastCollisionId",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Test Collision",
                              icon: "zap",
                              variant: "primary",
                              event: "COLLISION",
                              payload: {
                                entityId: "test-object",
                              },
                            },
                            {
                              type: "button",
                              label: "Clear",
                              icon: "x-circle",
                              variant: "secondary",
                              event: "CLEAR",
                            },
                            {
                              type: "button",
                              label: "Disable",
                              icon: "circle-off",
                              variant: "destructive",
                              event: "DISABLE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "CLEAR",
                effects: [
                  ["fetch", "CollisionData"],
                  ["set", "@entity.isColliding", false],
                  ["set", "@entity.lastCollisionId", ""],
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
                              name: "crosshair",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              text: "Collision System",
                              variant: "h3",
                            },
                            {
                              type: "badge",
                              label: "Active",
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
                              label: "Entity ID",
                              value: "@entity.id",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Last Collision",
                              value: "@entity.lastCollisionId",
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
                              type: "badge",
                              label: "Colliding",
                              value: "@entity.isColliding",
                              icon: "alert-triangle",
                            },
                            {
                              type: "badge",
                              label: "Last Hit",
                              value: "@entity.lastCollisionId",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Test Collision",
                              icon: "zap",
                              variant: "primary",
                              event: "COLLISION",
                              payload: {
                                entityId: "test-object",
                              },
                            },
                            {
                              type: "button",
                              label: "Clear",
                              icon: "x-circle",
                              variant: "secondary",
                              event: "CLEAR",
                            },
                            {
                              type: "button",
                              label: "Disable",
                              icon: "circle-off",
                              variant: "destructive",
                              event: "DISABLE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Disabled",
                event: "DISABLE",
                effects: [
                  ["fetch", "CollisionData"],
                  ["set", "@entity.isColliding", false],
                  ["set", "@entity.lastCollisionId", ""],
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
                              name: "crosshair",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              text: "Collision System",
                              variant: "h3",
                            },
                            {
                              type: "badge",
                              label: "Disabled",
                              variant: "secondary",
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
                              label: "Entity ID",
                              value: "@entity.id",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Last Collision",
                              value: "@entity.lastCollisionId",
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
                              type: "badge",
                              label: "Colliding",
                              value: "@entity.isColliding",
                              icon: "alert-triangle",
                            },
                            {
                              type: "badge",
                              label: "Last Hit",
                              value: "@entity.lastCollisionId",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Enable",
                              icon: "circle-dot",
                              variant: "primary",
                              event: "ENABLE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Disabled",
                to: "Active",
                event: "ENABLE",
                effects: [
                  ["fetch", "CollisionData"],
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
                              name: "crosshair",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              text: "Collision System",
                              variant: "h3",
                            },
                            {
                              type: "badge",
                              label: "Active",
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
                              label: "Entity ID",
                              value: "@entity.id",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Last Collision",
                              value: "@entity.lastCollisionId",
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
                              type: "badge",
                              label: "Colliding",
                              value: "@entity.isColliding",
                              icon: "alert-triangle",
                            },
                            {
                              type: "badge",
                              label: "Last Hit",
                              value: "@entity.lastCollisionId",
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
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Test Collision",
                              icon: "zap",
                              variant: "primary",
                              event: "COLLISION",
                              payload: {
                                entityId: "test-object",
                              },
                            },
                            {
                              type: "button",
                              label: "Clear",
                              icon: "x-circle",
                              variant: "secondary",
                              event: "CLEAR",
                            },
                            {
                              type: "button",
                              label: "Disable",
                              icon: "circle-off",
                              variant: "destructive",
                              event: "DISABLE",
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
          name: "CollisionPage",
          path: "/collision",
          isInitial: true,
          traits: [
            {
              ref: "Collision",
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

export const GAME_CORE_BEHAVIORS: BehaviorSchema[] = [
  GAME_LOOP_BEHAVIOR,
  PHYSICS_2D_BEHAVIOR,
  INPUT_BEHAVIOR,
  COLLISION_BEHAVIOR,
];
