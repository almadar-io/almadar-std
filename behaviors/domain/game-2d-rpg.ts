/**
 * 2D RPG Game Behaviors
 *
 * Standard behaviors for 2D RPG games: overworld navigation, quests,
 * NPC interaction, and crafting.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: game-first patterns (isometric-canvas, game-hud, dialogue-box)
 * replacing stat-card dashboard layouts with proper game components.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from '../types.js';

// ── Shared RPG Theme ────────────────────────────────────────────────

const RPG_THEME = {
  name: 'game-rpg-purple',
  tokens: {
    colors: {
      primary: '#7c3aed',
      'primary-hover': '#6d28d9',
      'primary-foreground': '#ffffff',
      accent: '#a78bfa',
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

const TILES_8X6: Array<{ x: number; y: number; terrain: string }> = [];
for (let y = 0; y < 6; y++) {
  for (let x = 0; x < 8; x++) {
    TILES_8X6.push({ x, y, terrain: (x + y) % 3 === 0 ? 'stone' : (x + y) % 3 === 1 ? 'dirt' : 'bridge' });
  }
}

const TILES_5X5 = [
  { x: 0, y: 0, terrain: 'stone' }, { x: 1, y: 0, terrain: 'dirt' }, { x: 2, y: 0, terrain: 'stone' }, { x: 3, y: 0, terrain: 'dirt' }, { x: 4, y: 0, terrain: 'stone' },
  { x: 0, y: 1, terrain: 'dirt' }, { x: 1, y: 1, terrain: 'stone' }, { x: 2, y: 1, terrain: 'dirt' }, { x: 3, y: 1, terrain: 'stone' }, { x: 4, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'stone' }, { x: 1, y: 2, terrain: 'dirt' }, { x: 2, y: 2, terrain: 'bridge' }, { x: 3, y: 2, terrain: 'dirt' }, { x: 4, y: 2, terrain: 'stone' },
  { x: 0, y: 3, terrain: 'dirt' }, { x: 1, y: 3, terrain: 'stone' }, { x: 2, y: 3, terrain: 'dirt' }, { x: 3, y: 3, terrain: 'stone' }, { x: 4, y: 3, terrain: 'dirt' },
  { x: 0, y: 4, terrain: 'stone' }, { x: 1, y: 4, terrain: 'dirt' }, { x: 2, y: 4, terrain: 'stone' }, { x: 3, y: 4, terrain: 'wall' }, { x: 4, y: 4, terrain: 'stone' },
];

// ============================================================================
// std-overworld - World Map Navigation
// ============================================================================

const overworldExploringMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'player', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'portal', x: 6, y: 4, featureType: 'portal' },
    { id: 'chest', x: 4, y: 0, featureType: 'treasure' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  tileClickEvent: 'MOVE',
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const overworldExploringHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Zone', value: '@entity.currentZone', icon: 'map-pin' },
      { label: 'X', value: '@entity.playerX', icon: 'compass' },
      { label: 'Y', value: '@entity.playerY', icon: 'compass' },
    ] },
    { type: 'button', label: 'Travel to Zone', action: 'TRAVEL', icon: 'map', variant: 'primary' },
  ],
}];

const overworldTravelingMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'player', x: 4, y: 3, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'portal', x: 6, y: 4, featureType: 'portal' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const overworldTravelingHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'progress-bar', value: 50, max: 100, label: 'Travel Progress' },
    { type: 'badge', label: '@entity.currentZone', icon: 'map-pin', variant: 'primary' },
    { type: 'button', label: 'Arrive', action: 'ARRIVE', icon: 'flag', variant: 'primary' },
  ],
}];

const overworldEventMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'player', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'battle', x: 3, y: 2, featureType: 'battle_marker' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const overworldEventHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Zone', value: '@entity.currentZone', icon: 'map-pin' },
    ] },
    { type: 'badge', label: 'World Event!', icon: 'swords', variant: 'warning' },
    { type: 'button', label: 'Resolve Event', action: 'RESOLVE_EVENT', icon: 'check-circle', variant: 'primary' },
  ],
}];

/**
 * std-overworld - Zone-based world map navigation.
 *
 * States: Exploring -> Traveling -> Event
 * Tracks current zone and player position on the overworld.
 */
export const OVERWORLD_BEHAVIOR: BehaviorSchema = {
  name: "std-overworld",
  version: "1.0.0",
  description: "Zone-based world map navigation for RPG overworld",
  theme: {
    name: "game-rpg-purple",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "OverworldOrbital",
      entity: {
        name: "OverworldData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "currentZone",
            type: "string",
            default: "town",
          },
          {
            name: "playerX",
            type: "number",
            default: 0,
          },
          {
            name: "playerY",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "Overworld",
          linkedEntity: "OverworldData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Exploring",
                isInitial: true,
              },
              {
                name: "Traveling",
              },
              {
                name: "Event",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "MOVE",
                name: "Move",
                payloadSchema: [
                  {
                    name: "dx",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "dy",
                    type: "number",
                    required: true,
                  },
                ],
              },
              {
                key: "TRAVEL",
                name: "Travel",
                payloadSchema: [
                  {
                    name: "zone",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "ARRIVE",
                name: "Arrive",
              },
              {
                key: "TRIGGER_EVENT",
                name: "Trigger Event",
              },
              {
                key: "RESOLVE_EVENT",
                name: "Resolve Event",
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
                from: "Exploring",
                to: "Exploring",
                event: "INIT",
                effects: [
                  ["fetch", "OverworldData"],
                  ["set", "@entity.currentZone", "town"],
                  ["set", "@entity.playerX", 0],
                  ["set", "@entity.playerY", 0],
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                              label: "Zone",
                              value: "@entity.currentZone",
                              icon: "map-pin",
                            },
                            {
                              label: "X",
                              value: "@entity.playerX",
                              icon: "compass",
                            },
                            {
                              label: "Y",
                              value: "@entity.playerY",
                              icon: "compass",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Travel to Zone",
                          icon: "map",
                          variant: "primary",
                          event: "TRAVEL",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Exploring",
                to: "Exploring",
                event: "MOVE",
                effects: [
                  ["fetch", "OverworldData"],
                  [
                    "set",
                    "@entity.playerX",
                    ["+", "@entity.playerX", "@payload.dx"],
                  ],
                  [
                    "set",
                    "@entity.playerY",
                    ["+", "@entity.playerY", "@payload.dy"],
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                              label: "Zone",
                              value: "@entity.currentZone",
                              icon: "map-pin",
                            },
                            {
                              label: "X",
                              value: "@entity.playerX",
                              icon: "compass",
                            },
                            {
                              label: "Y",
                              value: "@entity.playerY",
                              icon: "compass",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Travel to Zone",
                          icon: "map",
                          variant: "primary",
                          event: "TRAVEL",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Exploring",
                to: "Traveling",
                event: "TRAVEL",
                effects: [
                  ["set", "@entity.currentZone", "@payload.zone"],
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                          type: "progress-bar",
                          value: 50,
                          max: 100,
                          label: "Travel Progress",
                        },
                        {
                          type: "badge",
                          label: "@entity.currentZone",
                          icon: "map-pin",
                          variant: "primary",
                        },
                        {
                          type: "button",
                          label: "Arrive",
                          icon: "flag",
                          variant: "primary",
                          event: "ARRIVE",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Traveling",
                to: "Exploring",
                event: "ARRIVE",
                effects: [
                  ["fetch", "OverworldData"],
                  ["set", "@entity.playerX", 0],
                  ["set", "@entity.playerY", 0],
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                              label: "Zone",
                              value: "@entity.currentZone",
                              icon: "map-pin",
                            },
                            {
                              label: "X",
                              value: "@entity.playerX",
                              icon: "compass",
                            },
                            {
                              label: "Y",
                              value: "@entity.playerY",
                              icon: "compass",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Travel to Zone",
                          icon: "map",
                          variant: "primary",
                          event: "TRAVEL",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Exploring",
                to: "Event",
                event: "TRIGGER_EVENT",
                effects: [
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                              label: "Zone",
                              value: "@entity.currentZone",
                              icon: "map-pin",
                            },
                          ],
                        },
                        {
                          type: "badge",
                          label: "World Event!",
                          icon: "swords",
                          variant: "warning",
                        },
                        {
                          type: "button",
                          label: "Resolve Event",
                          icon: "check-circle",
                          variant: "primary",
                          event: "RESOLVE_EVENT",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Event",
                to: "Exploring",
                event: "RESOLVE_EVENT",
                effects: [
                  ["fetch", "OverworldData"],
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
                          x: 6,
                          y: 0,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          x: 6,
                          y: 1,
                          terrain: "grass",
                        },
                        {
                          x: 7,
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
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 2,
                          terrain: "grass",
                        },
                        {
                          x: 6,
                          y: 2,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 3,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 3,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 3,
                          terrain: "grass",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 4,
                          terrain: "bridge",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 3,
                          y: 5,
                          terrain: "grass",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 6,
                          terrain: "stone",
                        },
                        {
                          x: 0,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 1,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 6,
                          y: 7,
                          terrain: "stone",
                        },
                        {
                          x: 7,
                          y: 7,
                          terrain: "stone",
                        },
                      ],
                      units: [
                        {
                          id: "player",
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
                        terrains: {
                          grass: "/terrain/Isometric/dirtTiles_N.png",
                          stone: "/terrain/Isometric/stoneSide_N.png",
                          dirt: "/terrain/Isometric/dirt_N.png",
                          bridge: "/terrain/Isometric/stoneStep_N.png",
                          wall: "/terrain/Isometric/stoneWallArchway_N.png",
                        },
                        units: {
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                        },
                        features: {
                          gold_mine: "/world-map/gold_mine.png",
                          treasure: "/world-map/treasure_chest_closed.png",
                          power_node: "/world-map/power_node.png",
                          portal: "/world-map/portal_open.png",
                        },
                      },
                      features: [
                        {
                          id: "capital",
                          x: 1,
                          y: 1,
                          featureType: "gold_mine",
                        },
                        {
                          id: "forest",
                          x: 6,
                          y: 1,
                          featureType: "treasure",
                        },
                        {
                          id: "desert",
                          x: 1,
                          y: 6,
                          featureType: "power_node",
                        },
                        {
                          id: "portal",
                          x: 6,
                          y: 6,
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
                              label: "Zone",
                              value: "@entity.currentZone",
                              icon: "map-pin",
                            },
                            {
                              label: "X",
                              value: "@entity.playerX",
                              icon: "compass",
                            },
                            {
                              label: "Y",
                              value: "@entity.playerY",
                              icon: "compass",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Travel to Zone",
                          icon: "map",
                          variant: "primary",
                          event: "TRAVEL",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Exploring",
                to: "Exploring",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Exploring",
                to: "Exploring",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Exploring",
                to: "Exploring",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Exploring",
                to: "Exploring",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Traveling",
                to: "Traveling",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Traveling",
                to: "Traveling",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Traveling",
                to: "Traveling",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Traveling",
                to: "Traveling",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Event",
                to: "Event",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Event",
                to: "Event",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Event",
                to: "Event",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Event",
                to: "Event",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "OverworldPage",
          path: "/overworld",
          isInitial: true,
          traits: [
            {
              ref: "Overworld",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-quest - Quest Tracking
// ============================================================================

// ── Reusable main-view effects (quest list) ─────────────────────────

const questListMainEffect = ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
  // Header: scroll icon + title
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'scroll', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Quests' },
    ] },
  ] },
  { type: 'divider' },
  // Quest data list
  { type: 'data-list', entity: 'Quest', variant: 'card',
    fields: [
      { name: 'title', label: 'Quest', icon: 'scroll', variant: 'h4' },
      { name: 'description', label: 'Description', icon: 'file-text', variant: 'body' },
      { name: 'status', label: 'Status', icon: 'flag', variant: 'badge' },
      { name: 'reward', label: 'Reward', icon: 'gem', variant: 'body', format: 'number' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW', icon: 'eye', variant: 'secondary' },
    ],
  },
] }];

const questDetailModalEffect = ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
  // Modal header
  { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'scroll', size: 'md' },
      { type: 'typography', variant: 'h3', content: '@entity.title' },
    ] },
    { type: 'badge', label: '@entity.status', icon: 'flag', variant: 'accent' },
  ] },
  { type: 'divider' },
  // Quest details
  { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'typography', variant: 'body', content: '@entity.description' },
    { type: 'stats', label: 'Reward', icon: 'gem', value: '@entity.reward' },
  ] },
  { type: 'divider' },
  // Actions
  { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
    { type: 'button', label: 'Close', icon: 'x', variant: 'secondary', action: 'CLOSE' },
  ] },
] }];

const closeModalEffect = ['render-ui', 'modal', null];

/**
 * std-quest - Quest lifecycle management.
 *
 * States: Available -> Active -> Completed / Failed
 * CRUD-like quest tracking with status progression.
 */
export const QUEST_BEHAVIOR: BehaviorSchema = {
  name: "std-quest",
  version: "1.0.0",
  description: "Quest tracking with status progression",
  theme: {
    name: "game-rpg-purple",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "QuestOrbital",
      entity: {
        name: "Quest",
        persistence: "persistent",
        collection: "quests",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "title",
            type: "string",
            default: "",
          },
          {
            name: "description",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "available",
          },
          {
            name: "reward",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "QuestTracker",
          linkedEntity: "Quest",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Available",
                isInitial: true,
              },
              {
                name: "Active",
              },
              {
                name: "Completed",
              },
              {
                name: "Failed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "ACCEPT",
                name: "Accept Quest",
              },
              {
                key: "COMPLETE",
                name: "Complete Quest",
              },
              {
                key: "FAIL",
                name: "Fail Quest",
              },
              {
                key: "RESET",
                name: "Reset Quest",
              },
              {
                key: "VIEW",
                name: "View Quest",
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
                from: "Available",
                to: "Available",
                event: "INIT",
                effects: [
                  ["fetch", "Quest"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Available",
                to: "Active",
                event: "ACCEPT",
                effects: [
                  ["fetch", "Quest"],
                  ["set", "@entity.status", "active"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Active",
                to: "Completed",
                event: "COMPLETE",
                effects: [
                  ["fetch", "Quest"],
                  ["set", "@entity.status", "completed"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Active",
                to: "Failed",
                event: "FAIL",
                effects: [
                  ["fetch", "Quest"],
                  ["set", "@entity.status", "failed"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Completed",
                to: "Available",
                event: "RESET",
                effects: [
                  ["fetch", "Quest"],
                  ["set", "@entity.status", "available"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Failed",
                to: "Available",
                event: "RESET",
                effects: [
                  ["fetch", "Quest"],
                  ["set", "@entity.status", "available"],
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
                                  name: "scroll",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  content: "Quests",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Quest",
                          variant: "card",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              icon: "eye",
                              variant: "secondary",
                            },
                          ],
                          emptyIcon: "scroll",
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
                                      name: "target",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.title",
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
                                      content: "@entity.description",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
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
                from: "Available",
                to: "Available",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "scroll",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.status",
                              icon: "flag",
                              variant: "accent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.description",
                            },
                            {
                              type: "stat-display",
                              label: "Reward",
                              icon: "gem",
                              value: "@entity.reward",
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
                          justify: "end",
                          children: [
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
                from: "Active",
                to: "Active",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "scroll",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.status",
                              icon: "flag",
                              variant: "accent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.description",
                            },
                            {
                              type: "stat-display",
                              label: "Reward",
                              icon: "gem",
                              value: "@entity.reward",
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
                          justify: "end",
                          children: [
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
                from: "Completed",
                to: "Completed",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "scroll",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.status",
                              icon: "flag",
                              variant: "accent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.description",
                            },
                            {
                              type: "stat-display",
                              label: "Reward",
                              icon: "gem",
                              value: "@entity.reward",
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
                          justify: "end",
                          children: [
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
                from: "Failed",
                to: "Failed",
                event: "VIEW",
                effects: [
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "scroll",
                                  size: "md",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "@entity.title",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.status",
                              icon: "flag",
                              variant: "accent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "typography",
                              variant: "body",
                              content: "@entity.description",
                            },
                            {
                              type: "stat-display",
                              label: "Reward",
                              icon: "gem",
                              value: "@entity.reward",
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
                          justify: "end",
                          children: [
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
                from: "Available",
                to: "Available",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Completed",
                to: "Completed",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Failed",
                to: "Failed",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Available",
                to: "Available",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Completed",
                to: "Completed",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "Failed",
                to: "Failed",
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
          name: "QuestsPage",
          path: "/quests",
          isInitial: true,
          traits: [
            {
              ref: "QuestTracker",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-npc - NPC Interaction
// ============================================================================

const npcIdleMainEffect = ['render-ui', 'main', {
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

const npcIdleHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'NPC', value: '@entity.name', icon: 'crown' },
      { label: 'Disposition', value: '@entity.disposition', icon: 'heart' },
    ] },
    { type: 'button', label: 'Talk', action: 'TALK', icon: 'message-circle', variant: 'primary' },
  ],
}];

const npcTalkingMainEffect = ['render-ui', 'main', {
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

const npcTalkingModal = ['render-ui', 'modal', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'message-circle' },
      { type: 'typography', variant: 'h3', content: '@entity.name' },
    ] },
    { type: 'divider' },
    { type: 'typography', variant: 'body', content: '@entity.dialogue' },
    { type: 'badge', label: '@entity.disposition', icon: 'heart', variant: 'accent' },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Trade', action: 'TRADE', icon: 'gem', variant: 'primary' },
      { type: 'button', label: 'End Talk', action: 'END_TALK', icon: 'x', variant: 'secondary' },
    ] },
  ],
}];

const npcTradingMainEffect = ['render-ui', 'main', {
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

const npcTradingModal = ['render-ui', 'modal', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'gem' },
        { type: 'typography', variant: 'h3', content: 'Trading' },
      ] },
      { type: 'badge', label: '@entity.name', icon: 'crown', variant: 'primary' },
    ] },
    { type: 'divider' },
    { type: 'typography', variant: 'body', content: 'Browse wares and make your trade.' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Merchant', icon: 'crown', value: '@entity.name' },
      { type: 'stats', label: 'Disposition', icon: 'heart', value: '@entity.disposition' },
    ] },
    { type: 'divider' },
    { type: 'button', label: 'End Trade', action: 'END_TRADE', icon: 'x', variant: 'secondary' },
  ],
}];

/**
 * std-npc - NPC interaction flow.
 *
 * States: Idle -> Talking -> Trading
 * Simple conversation and trade flow with NPCs.
 */
export const NPC_BEHAVIOR: BehaviorSchema = {
  name: "std-npc",
  version: "1.0.0",
  description: "NPC interaction with dialogue and trading",
  theme: {
    name: "game-rpg-purple",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "NpcOrbital",
      entity: {
        name: "NpcData",
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
            name: "dialogue",
            type: "string",
            default: "",
          },
          {
            name: "disposition",
            type: "string",
            default: "neutral",
          },
        ],
      },
      traits: [
        {
          name: "NpcInteraction",
          linkedEntity: "NpcData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Idle",
                isInitial: true,
              },
              {
                name: "Talking",
              },
              {
                name: "Trading",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "TALK",
                name: "Talk",
              },
              {
                key: "TRADE",
                name: "Trade",
              },
              {
                key: "END_TALK",
                name: "End Talk",
              },
              {
                key: "END_TRADE",
                name: "End Trade",
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
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
                  ["set", "@entity.dialogue", ""],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
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
                      gap: "md",
                      children: [
                        {
                          type: "game-hud",
                          position: "top",
                          elements: [
                            {
                              label: "NPC",
                              value: "@entity.name",
                              icon: "crown",
                            },
                            {
                              label: "Disposition",
                              value: "@entity.disposition",
                              icon: "heart",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Talk",
                          icon: "message-circle",
                          variant: "primary",
                          event: "TALK",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Idle",
                to: "Talking",
                event: "TALK",
                effects: [
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "message-circle",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "@entity.name",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "@entity.dialogue",
                        },
                        {
                          type: "badge",
                          label: "@entity.disposition",
                          icon: "heart",
                          variant: "accent",
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
                              label: "Trade",
                              icon: "gem",
                              variant: "primary",
                              event: "TRADE",
                            },
                            {
                              type: "button",
                              label: "End Talk",
                              icon: "x",
                              variant: "secondary",
                              event: "END_TALK",
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
                      type: "dialogue-box",
                      dialogue: {
                        speaker: "@entity.name",
                        text: "@entity.dialogue",
                        choices: [
                          {
                            text: "Trade",
                            value: "trade",
                          },
                          {
                            text: "Goodbye",
                            value: "goodbye",
                          },
                        ],
                      },
                      typewriterSpeed: 30,
                      position: "bottom",
                      choiceEvent: "TRADE",
                    },
                  ],
                ],
              },
              {
                from: "Talking",
                to: "Trading",
                event: "TRADE",
                effects: [
                  ["fetch", "NpcData"],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "md",
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
                                  name: "gem",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Trading",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.name",
                              icon: "crown",
                              variant: "primary",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          content: "Browse wares and make your trade.",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Merchant",
                              icon: "crown",
                              value: "@entity.name",
                            },
                            {
                              type: "stat-display",
                              label: "Disposition",
                              icon: "heart",
                              value: "@entity.disposition",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "End Trade",
                          icon: "x",
                          variant: "secondary",
                          event: "END_TRADE",
                        },
                      ],
                    },
                  ],
                  [
                    "render-ui",
                    "overlay",
                    {
                      type: "dialogue-box",
                      dialogue: {
                        speaker: "@entity.name",
                        text: "What would you like to trade?",
                        choices: [
                          {
                            text: "Done Trading",
                            value: "done",
                          },
                        ],
                      },
                      typewriterSpeed: 0,
                      position: "bottom",
                      choiceEvent: "END_TRADE",
                    },
                  ],
                ],
              },
              {
                from: "Talking",
                to: "Idle",
                event: "END_TALK",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
                ],
              },
              {
                from: "Trading",
                to: "Idle",
                event: "END_TRADE",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
                ],
              },
              {
                from: "Talking",
                to: "Idle",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
                ],
              },
              {
                from: "Talking",
                to: "Idle",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
                ],
              },
              {
                from: "Trading",
                to: "Idle",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
                ],
              },
              {
                from: "Trading",
                to: "Idle",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
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
                          terrain: "dirt",
                        },
                        {
                          x: 3,
                          y: 0,
                          terrain: "stone",
                        },
                        {
                          x: 4,
                          y: 0,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 2,
                          y: 1,
                          terrain: "stone",
                        },
                        {
                          x: 3,
                          y: 1,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 1,
                          y: 2,
                          terrain: "stone",
                        },
                        {
                          x: 2,
                          y: 2,
                          terrain: "bridge",
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
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 0,
                          y: 4,
                          terrain: "dirt",
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
                          terrain: "dirt",
                        },
                        {
                          x: 5,
                          y: 4,
                          terrain: "stone",
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
                          terrain: "dirt",
                        },
                        {
                          x: 4,
                          y: 5,
                          terrain: "stone",
                        },
                        {
                          x: 5,
                          y: 5,
                          terrain: "dirt",
                        },
                      ],
                      units: [
                        {
                          id: "npc",
                          x: 3,
                          y: 2,
                          unitType: "archivist",
                        },
                        {
                          id: "player",
                          x: 2,
                          y: 4,
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
                          archivist: "/sprite-sheets/archivist-sprite-sheet-se.png",
                          guardian: "/sprite-sheets/guardian-sprite-sheet-se.png",
                        },
                        features: {
                          treasure: "/world-map/treasure_chest_closed.png",
                        },
                      },
                      features: [
                        {
                          id: "shop",
                          x: 4,
                          y: 2,
                          featureType: "treasure",
                        },
                      ],
                    },
                  ],
                  ["render-ui", "overlay", null],
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
                from: "Talking",
                to: "Talking",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Talking",
                to: "Talking",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Talking",
                to: "Talking",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Talking",
                to: "Talking",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Trading",
                to: "Trading",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Trading",
                to: "Trading",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Trading",
                to: "Trading",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Trading",
                to: "Trading",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "NpcPage",
          path: "/npc",
          isInitial: true,
          traits: [
            {
              ref: "NpcInteraction",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-crafting - Item Crafting
// ============================================================================

const craftingBrowsingMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'crafter', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: false,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const craftingBrowsingHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Recipe', value: '@entity.selectedRecipe', icon: 'scroll' },
      { label: 'Materials', value: '@entity.materials', icon: 'backpack' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Select Recipe', action: 'SELECT_RECIPE', icon: 'scroll', variant: 'secondary' },
      { type: 'button', label: 'Craft', action: 'CRAFT', icon: 'wand-2', variant: 'primary' },
    ] },
  ],
}];

const craftingInProgressMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'crafter', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: false,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const craftingInProgressHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'typography', variant: 'h3', content: 'Crafting...' },
    { type: 'progress-bar', value: 75, max: 100, label: 'Crafting Progress' },
    { type: 'stats', label: 'Recipe', icon: 'scroll', value: '@entity.selectedRecipe' },
    { type: 'button', label: 'Collect', action: 'COLLECT', icon: 'gem', variant: 'primary' },
  ],
}];

const craftingDoneMainEffect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'crafter', x: 2, y: 2, unitType: 'guardian' }],
  scale: 0.5,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: false,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const craftingDoneHud = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'gem' },
      { type: 'typography', variant: 'h3', content: 'Item Crafted!' },
    ] },
    { type: 'stats', label: 'Crafted Item', icon: 'gem', value: '@entity.result' },
    { type: 'badge', label: '@entity.selectedRecipe', icon: 'scroll', variant: 'success' },
    { type: 'button', label: 'Back to Recipes', action: 'BACK', icon: 'arrow-left', variant: 'secondary' },
  ],
}];

/**
 * std-crafting - Recipe-based item crafting.
 *
 * States: Browsing -> Crafting -> Done
 * Recipe selection and crafting execution flow.
 */
export const CRAFTING_BEHAVIOR: BehaviorSchema = {
  name: "std-crafting",
  version: "1.0.0",
  description: "Recipe-based item crafting system",
  theme: {
    name: "game-rpg-purple",
    tokens: {
      colors: {
        primary: "#7c3aed",
        "primary-hover": "#6d28d9",
        "primary-foreground": "#ffffff",
        accent: "#a78bfa",
        "accent-foreground": "#000000",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "CraftingOrbital",
      entity: {
        name: "CraftingData",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "selectedRecipe",
            type: "string",
            default: "",
          },
          {
            name: "materials",
            type: "string",
            default: "",
          },
          {
            name: "result",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "Crafting",
          linkedEntity: "CraftingData",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Browsing",
                isInitial: true,
              },
              {
                name: "Crafting",
              },
              {
                name: "Done",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "SELECT_RECIPE",
                name: "Select Recipe",
                payloadSchema: [
                  {
                    name: "recipe",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CRAFT",
                name: "Craft",
              },
              {
                key: "COLLECT",
                name: "Collect Result",
              },
              {
                key: "BACK",
                name: "Back to Browsing",
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
                from: "Browsing",
                to: "Browsing",
                event: "INIT",
                effects: [
                  ["fetch", "CraftingData"],
                  ["set", "@entity.selectedRecipe", ""],
                  ["set", "@entity.result", ""],
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
                              name: "hammer",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Crafting Station",
                            },
                            {
                              type: "badge",
                              label: "Browsing",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Available Recipes",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "sword",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Iron Sword",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Iron Sword",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shield",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Wooden Shield",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Wooden Shield",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "gem",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Ruby Amulet",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Ruby Amulet",
                                      },
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
                from: "Browsing",
                to: "Browsing",
                event: "SELECT_RECIPE",
                effects: [
                  ["fetch", "CraftingData"],
                  ["set", "@entity.selectedRecipe", "@payload.recipe"],
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
                              name: "hammer",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Crafting Station",
                            },
                            {
                              type: "badge",
                              label: "Browsing",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          label: "Selected Recipe",
                          icon: "scroll",
                          value: "@entity.selectedRecipe",
                        },
                        {
                          type: "stat-display",
                          label: "Materials",
                          icon: "backpack",
                          value: "@entity.materials",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Available Recipes",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "sword",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Iron Sword",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Iron Sword",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shield",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Wooden Shield",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Wooden Shield",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "gem",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Ruby Amulet",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Ruby Amulet",
                                      },
                                    },
                                  ],
                                },
                              ],
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
                              label: "Craft",
                              icon: "wand-2",
                              variant: "primary",
                              event: "CRAFT",
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
                to: "Crafting",
                event: "CRAFT",
                guard: ["!=", "@entity.selectedRecipe", ""],
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
                              name: "hammer",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Crafting Station",
                            },
                            {
                              type: "badge",
                              label: "Crafting",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h3",
                          content: "Crafting in Progress...",
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Recipe",
                                  icon: "scroll",
                                  value: "@entity.selectedRecipe",
                                },
                                {
                                  type: "stat-display",
                                  label: "Materials Required",
                                  icon: "backpack",
                                  value: "@entity.materials",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Collect",
                          icon: "gem",
                          variant: "primary",
                          event: "COLLECT",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Crafting",
                to: "Done",
                event: "COLLECT",
                effects: [
                  ["set", "@entity.result", "@entity.selectedRecipe"],
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
                              name: "hammer",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Crafting Station",
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
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "gem",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Item Crafted!",
                            },
                          ],
                        },
                        {
                          type: "card",
                          children: [
                            {
                              type: "stack",
                              direction: "vertical",
                              gap: "md",
                              children: [
                                {
                                  type: "stat-display",
                                  label: "Crafted Item",
                                  icon: "gem",
                                  value: "@entity.result",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.selectedRecipe",
                                  icon: "scroll",
                                  variant: "success",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Back to Recipes",
                          icon: "arrow-left",
                          variant: "secondary",
                          event: "BACK",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Done",
                to: "Browsing",
                event: "BACK",
                effects: [
                  ["fetch", "CraftingData"],
                  ["set", "@entity.selectedRecipe", ""],
                  ["set", "@entity.result", ""],
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
                              name: "hammer",
                            },
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Crafting Station",
                            },
                            {
                              type: "badge",
                              label: "Browsing",
                              variant: "default",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Available Recipes",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "sm",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "sword",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Iron Sword",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Iron Sword",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "shield",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Wooden Shield",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Wooden Shield",
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "gem",
                                    },
                                    {
                                      type: "typography",
                                      variant: "body",
                                      content: "Ruby Amulet",
                                    },
                                    {
                                      type: "button",
                                      label: "Select",
                                      variant: "secondary",
                                      size: "sm",
                                      event: "SELECT_RECIPE",
                                      eventPayload: {
                                        recipe: "Ruby Amulet",
                                      },
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
                from: "Browsing",
                to: "Browsing",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Browsing",
                to: "Browsing",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Browsing",
                to: "Browsing",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Browsing",
                to: "Browsing",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Crafting",
                to: "Crafting",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Crafting",
                to: "Crafting",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Crafting",
                to: "Crafting",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Crafting",
                to: "Crafting",
                event: "TILE_LEAVE",
                effects: [],
              },
              {
                from: "Done",
                to: "Done",
                event: "TILE_CLICK",
                effects: [],
              },
              {
                from: "Done",
                to: "Done",
                event: "UNIT_CLICK",
                effects: [],
              },
              {
                from: "Done",
                to: "Done",
                event: "TILE_HOVER",
                effects: [],
              },
              {
                from: "Done",
                to: "Done",
                event: "TILE_LEAVE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "CraftingPage",
          path: "/crafting",
          isInitial: true,
          traits: [
            {
              ref: "Crafting",
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

export const GAME_2D_RPG_BEHAVIORS: BehaviorSchema[] = [
  OVERWORLD_BEHAVIOR,
  QUEST_BEHAVIOR,
  NPC_BEHAVIOR,
  CRAFTING_BEHAVIOR,
];
