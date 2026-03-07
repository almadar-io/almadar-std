/**
 * 2D RPG Game Behaviors
 *
 * Standard behaviors for 2D RPG games: overworld navigation, quests,
 * NPC interaction, and crafting.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-overworld - World Map Navigation
// ============================================================================

/**
 * std-overworld - Zone-based world map navigation.
 *
 * States: Exploring -> Traveling -> Event
 * Tracks current zone and player position on the overworld.
 */
export const OVERWORLD_BEHAVIOR: OrbitalSchema = {
  name: 'std-overworld',
  version: '1.0.0',
  description: 'Zone-based world map navigation for RPG overworld',
  orbitals: [
    {
      name: 'OverworldOrbital',
      entity: {
        name: 'OverworldState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentZone', type: 'string', default: 'town' },
          { name: 'playerX', type: 'number', default: 0 },
          { name: 'playerY', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'Overworld',
          linkedEntity: 'OverworldState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Exploring', isInitial: true },
              { name: 'Traveling' },
              { name: 'Event' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'MOVE', name: 'Move', payloadSchema: [
                { name: 'dx', type: 'number', required: true },
                { name: 'dy', type: 'number', required: true },
              ] },
              { key: 'TRAVEL', name: 'Travel', payloadSchema: [
                { name: 'zone', type: 'string', required: true },
              ] },
              { key: 'ARRIVE', name: 'Arrive' },
              { key: 'TRIGGER_EVENT', name: 'Trigger Event' },
              { key: 'RESOLVE_EVENT', name: 'Resolve Event' },
            ],
            transitions: [
              {
                from: 'Exploring',
                to: 'Exploring',
                event: 'INIT',
                effects: [
                  ['fetch', 'OverworldState'],
                  ['set', '@entity.currentZone', 'town'],
                  ['set', '@entity.playerX', 0],
                  ['set', '@entity.playerY', 0],
                  ['render-ui', 'main', { type: 'page-header', title: 'Overworld' }],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'OverworldState',
                  }],
                ],
              },
              {
                from: 'Exploring',
                to: 'Exploring',
                event: 'MOVE',
                effects: [
                  ['fetch', 'OverworldState'],
                  ['set', '@entity.playerX', ['+', '@entity.playerX', '@payload.dx']],
                  ['set', '@entity.playerY', ['+', '@entity.playerY', '@payload.dy']],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'OverworldState',
                  }],
                ],
              },
              {
                from: 'Exploring',
                to: 'Traveling',
                event: 'TRAVEL',
                effects: [
                  ['set', '@entity.currentZone', '@payload.zone'],
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Traveling',
                to: 'Exploring',
                event: 'ARRIVE',
                effects: [
                  ['fetch', 'OverworldState'],
                  ['set', '@entity.playerX', 0],
                  ['set', '@entity.playerY', 0],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'OverworldState',
                  }],
                ],
              },
              {
                from: 'Exploring',
                to: 'Event',
                event: 'TRIGGER_EVENT',
                effects: [
                  ['render-ui', 'main', { type: 'dialogue-box',
                    dialogue: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Event',
                to: 'Exploring',
                event: 'RESOLVE_EVENT',
                effects: [
                  ['fetch', 'OverworldState'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'OverworldState',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'OverworldPage',
          path: '/overworld',
          isInitial: true,
          traits: [{ ref: 'Overworld' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-quest - Quest Tracking
// ============================================================================

/**
 * std-quest - Quest lifecycle management.
 *
 * States: Available -> Active -> Completed / Failed
 * CRUD-like quest tracking with status progression.
 */
export const QUEST_BEHAVIOR: OrbitalSchema = {
  name: 'std-quest',
  version: '1.0.0',
  description: 'Quest tracking with status progression',
  orbitals: [
    {
      name: 'QuestOrbital',
      entity: {
        name: 'Quest',
        persistence: 'persistent',
        collection: 'quests',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'available' },
          { name: 'reward', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'QuestTracker',
          linkedEntity: 'Quest',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Available', isInitial: true },
              { name: 'Active' },
              { name: 'Completed' },
              { name: 'Failed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'ACCEPT', name: 'Accept Quest' },
              { key: 'COMPLETE', name: 'Complete Quest' },
              { key: 'FAIL', name: 'Fail Quest' },
              { key: 'RESET', name: 'Reset Quest' },
              { key: 'VIEW', name: 'View Quest' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'Available',
                to: 'Available',
                event: 'INIT',
                effects: [
                  ['fetch', 'Quest'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Quests' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'Available',
                to: 'Active',
                event: 'ACCEPT',
                effects: [
                  ['fetch', 'Quest'],
                  ['set', '@entity.status', 'active'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Completed',
                event: 'COMPLETE',
                effects: [
                  ['fetch', 'Quest'],
                  ['set', '@entity.status', 'completed'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Failed',
                event: 'FAIL',
                effects: [
                  ['fetch', 'Quest'],
                  ['set', '@entity.status', 'failed'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'Completed',
                to: 'Available',
                event: 'RESET',
                effects: [
                  ['fetch', 'Quest'],
                  ['set', '@entity.status', 'available'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'Failed',
                to: 'Available',
                event: 'RESET',
                effects: [
                  ['fetch', 'Quest'],
                  ['set', '@entity.status', 'available'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quest',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'Available',
                to: 'Available',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'VIEW',
                effects: [
                  ['render-ui', 'modal', { type: 'detail-panel',
                    title: '@entity.title',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'Available',
                to: 'Available',
                event: 'CLOSE',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'CLOSE',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'Available',
                to: 'Available',
                event: 'CANCEL',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'CANCEL',
                effects: [['render-ui', 'modal', null]],
              },
              // VIEW/CLOSE/CANCEL from Completed and Failed
              { from: 'Completed', to: 'Completed', event: 'VIEW', effects: [['render-ui', 'modal', { type: 'detail-panel', title: '@entity.title', actions: [{ label: 'Close', event: 'CLOSE' }] }]] },
              { from: 'Failed', to: 'Failed', event: 'VIEW', effects: [['render-ui', 'modal', { type: 'detail-panel', title: '@entity.title', actions: [{ label: 'Close', event: 'CLOSE' }] }]] },
              { from: 'Completed', to: 'Completed', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'Failed', to: 'Failed', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'Completed', to: 'Completed', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'Failed', to: 'Failed', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'QuestsPage',
          path: '/quests',
          isInitial: true,
          traits: [{ ref: 'QuestTracker' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-npc - NPC Interaction
// ============================================================================

/**
 * std-npc - NPC interaction flow.
 *
 * States: Idle -> Talking -> Trading
 * Simple conversation and trade flow with NPCs.
 */
export const NPC_BEHAVIOR: OrbitalSchema = {
  name: 'std-npc',
  version: '1.0.0',
  description: 'NPC interaction with dialogue and trading',
  orbitals: [
    {
      name: 'NpcOrbital',
      entity: {
        name: 'NpcState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'dialogue', type: 'string', default: '' },
          { name: 'disposition', type: 'string', default: 'neutral' },
        ],
      },
      traits: [
        {
          name: 'NpcInteraction',
          linkedEntity: 'NpcState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Talking' },
              { name: 'Trading' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'TALK', name: 'Talk' },
              { key: 'TRADE', name: 'Trade' },
              { key: 'END_TALK', name: 'End Talk' },
              { key: 'END_TRADE', name: 'End Trade' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.dialogue', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'NPC' }],
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.name',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Talking',
                event: 'TALK',
                effects: [
                  ['render-ui', 'main', { type: 'dialogue-box',
                    dialogue: '@entity.dialogue',
                  }],
                ],
              },
              {
                from: 'Talking',
                to: 'Trading',
                event: 'TRADE',
                effects: [
                  ['fetch', 'NpcState'],
                  ['render-ui', 'main', { type: 'inventory-panel',
                    items: '@entity.name', slots: 20, columns: 5, onSelectSlot: 'SELECT_SLOT',
                  }],
                ],
              },
              {
                from: 'Talking',
                to: 'Idle',
                event: 'END_TALK',
                effects: [
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.name',
                  }],
                ],
              },
              {
                from: 'Trading',
                to: 'Idle',
                event: 'END_TRADE',
                effects: [
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.name',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'NpcPage',
          path: '/npc',
          isInitial: true,
          traits: [{ ref: 'NpcInteraction' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-crafting - Item Crafting
// ============================================================================

/**
 * std-crafting - Recipe-based item crafting.
 *
 * States: Browsing -> Crafting -> Done
 * Recipe selection and crafting execution flow.
 */
export const CRAFTING_BEHAVIOR: OrbitalSchema = {
  name: 'std-crafting',
  version: '1.0.0',
  description: 'Recipe-based item crafting system',
  orbitals: [
    {
      name: 'CraftingOrbital',
      entity: {
        name: 'CraftingState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'selectedRecipe', type: 'string', default: '' },
          { name: 'materials', type: 'string', default: '' },
          { name: 'result', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'Crafting',
          linkedEntity: 'CraftingState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Browsing', isInitial: true },
              { name: 'Crafting' },
              { name: 'Done' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_RECIPE', name: 'Select Recipe', payloadSchema: [
                { name: 'recipe', type: 'string', required: true },
              ] },
              { key: 'CRAFT', name: 'Craft' },
              { key: 'COLLECT', name: 'Collect Result' },
              { key: 'BACK', name: 'Back to Browsing' },
            ],
            transitions: [
              {
                from: 'Browsing',
                to: 'Browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'CraftingState'],
                  ['set', '@entity.selectedRecipe', ''],
                  ['set', '@entity.result', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Crafting' }],
                  ['render-ui', 'main', { type: 'inventory-panel',
                    items: '@entity.id', slots: 20, columns: 5, onSelectSlot: 'SELECT_SLOT',
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Browsing',
                event: 'SELECT_RECIPE',
                effects: [
                  ['fetch', 'CraftingState'],
                  ['set', '@entity.selectedRecipe', '@payload.recipe'],
                  ['render-ui', 'main', { type: 'inventory-panel',
                    items: '@entity.id', slots: 20, columns: 5, onSelectSlot: 'SELECT_SLOT',
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Crafting',
                event: 'CRAFT',
                guard: ['!=', '@entity.selectedRecipe', ''],
                effects: [
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Crafting',
                to: 'Done',
                event: 'COLLECT',
                effects: [
                  ['set', '@entity.result', '@entity.selectedRecipe'],
                  ['render-ui', 'main', { type: 'card',
                    title: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Done',
                to: 'Browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'CraftingState'],
                  ['set', '@entity.selectedRecipe', ''],
                  ['set', '@entity.result', ''],
                  ['render-ui', 'main', { type: 'inventory-panel',
                    items: '@entity.id', slots: 20, columns: 5, onSelectSlot: 'SELECT_SLOT',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CraftingPage',
          path: '/crafting',
          isInitial: true,
          traits: [{ ref: 'Crafting' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_2D_RPG_BEHAVIORS: OrbitalSchema[] = [
  OVERWORLD_BEHAVIOR,
  QUEST_BEHAVIOR,
  NPC_BEHAVIOR,
  CRAFTING_BEHAVIOR,
];
