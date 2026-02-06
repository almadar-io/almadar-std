/**
 * Game UI Behaviors
 *
 * Game interface behaviors: flow, dialogue, level progression.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from './types.js';

// ============================================================================
// std-gameflow - Game State Machine
// ============================================================================

/**
 * std-gameflow - Master game state management.
 *
 * States: Menu → Playing → Paused → GameOver/Victory
 */
export const GAME_FLOW_BEHAVIOR: BehaviorSchema = {
    name: 'std-gameflow',
    version: '1.0.0',
    description: 'Master game flow: menu, play, pause, game over, victory',
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
                    { name: 'lastState', type: 'string', default: 'Menu' },
                    { name: 'title', type: 'string', default: 'Game' },
                    { name: 'allowPause', type: 'boolean', default: true },
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
                            { name: 'GameOver', isTerminal: true },
                            { name: 'Victory', isTerminal: true },
                        ],
                        events: [
                            { key: 'START', name: 'Start' },
                            { key: 'PAUSE', name: 'Pause' },
                            { key: 'RESUME', name: 'Resume' },
                            { key: 'GAME_OVER', name: 'Game Over' },
                            { key: 'VICTORY', name: 'Victory' },
                            { key: 'RESTART', name: 'Restart' },
                            { key: 'QUIT', name: 'Quit' },
                        ],
                        transitions: [
                            {
                                from: 'Menu',
                                to: 'Menu',
                                event: 'QUIT',
                                effects: [
                                    ['emit', 'STOP'],
                                    ['render-ui', 'screen', {
                                        type: 'card',
                                        title: '@entity.title',
                                        actions: [{ event: 'START', label: 'Start Game' }],
                                    }],
                                ],
                            },
                            {
                                from: 'Menu',
                                to: 'Playing',
                                event: 'START',
                                effects: [
                                    ['set', '@entity.attempts', ['+', '@entity.attempts', 1]],
                                    ['set', '@entity.playTime', 0],
                                    ['emit', 'GAME_LOOP_START'],
                                ],
                            },
                            {
                                from: 'Playing',
                                to: 'Paused',
                                event: 'PAUSE',
                                guard: '@entity.allowPause',
                                effects: [
                                    ['set', '@entity.lastState', 'Playing'],
                                    ['emit', 'GAME_LOOP_PAUSE'],
                                    ['render-ui', 'overlay', {
                                        type: 'modal',
                                        title: 'Paused',
                                        content: { playTime: '@entity.playTime' },
                                        actions: [
                                            { event: 'RESUME', label: 'Resume' },
                                            { event: 'QUIT', label: 'Quit' },
                                        ],
                                    }],
                                ],
                            },
                            {
                                from: 'Paused',
                                to: 'Playing',
                                event: 'RESUME',
                                effects: [['emit', 'GAME_LOOP_RESUME']],
                            },
                            {
                                from: 'Playing',
                                to: 'GameOver',
                                event: 'GAME_OVER',
                                effects: [
                                    ['emit', 'STOP'],
                                    ['render-ui', 'overlay', {
                                        type: 'modal',
                                        title: 'Game Over',
                                        content: { playTime: '@entity.playTime', attempts: '@entity.attempts' },
                                        actions: [
                                            { event: 'RESTART', label: 'Try Again' },
                                            { event: 'QUIT', label: 'Quit' },
                                        ],
                                    }],
                                ],
                            },
                            {
                                from: 'Playing',
                                to: 'Victory',
                                event: 'VICTORY',
                                effects: [
                                    ['emit', 'STOP'],
                                    ['render-ui', 'overlay', {
                                        type: 'modal',
                                        title: 'Victory!',
                                        content: { playTime: '@entity.playTime', attempts: '@entity.attempts' },
                                        actions: [
                                            { event: 'RESTART', label: 'Play Again' },
                                            { event: 'QUIT', label: 'Quit' },
                                        ],
                                    }],
                                ],
                            },
                            {
                                from: 'GameOver',
                                to: 'Playing',
                                event: 'RESTART',
                                effects: [
                                    ['emit', 'GAME_RESET'],
                                    ['emit', 'START'],
                                ],
                            },
                            {
                                from: 'Victory',
                                to: 'Playing',
                                event: 'RESTART',
                                effects: [
                                    ['emit', 'GAME_RESET'],
                                    ['emit', 'START'],
                                ],
                            },
                            {
                                from: 'Playing',
                                to: 'Menu',
                                event: 'QUIT',
                                effects: [['emit', 'STOP']],
                            },
                            {
                                from: 'Paused',
                                to: 'Menu',
                                event: 'QUIT',
                                effects: [['emit', 'STOP']],
                            },
                            {
                                from: 'GameOver',
                                to: 'Menu',
                                event: 'QUIT',
                                effects: [['emit', 'STOP']],
                            },
                            {
                                from: 'Victory',
                                to: 'Menu',
                                event: 'QUIT',
                                effects: [['emit', 'STOP']],
                            },
                        ],
                    },
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// std-dialogue - NPC Conversation System
// ============================================================================

/**
 * std-dialogue - Manages NPC dialogue and branching conversations.
 */
export const DIALOGUE_BEHAVIOR: BehaviorSchema = {
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
                    { name: 'dialogueTree', type: 'array', default: [] },
                    { name: 'currentNode', type: 'number', default: 0 },
                    { name: 'displayedText', type: 'string', default: '' },
                    { name: 'isTyping', type: 'boolean', default: false },
                    { name: 'speaker', type: 'string', default: '' },
                    { name: 'typeIndex', type: 'number', default: 0 },
                    { name: 'lastTypeTime', type: 'number', default: 0 },
                    { name: 'typingSpeed', type: 'number', default: 50 },
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
                            { name: 'Typing' },
                            { name: 'Showing' },
                            { name: 'Choice' },
                        ],
                        events: [
                            { key: 'SHOW', name: 'Show' },
                            { key: 'NEXT', name: 'Next' },
                            { key: 'SELECT_CHOICE', name: 'Select Choice' },
                            { key: 'SKIP', name: 'Skip' },
                            { key: 'CLOSE', name: 'Close' },
                            { key: 'TYPE_CHAR', name: 'Type Char' },
                            { key: 'TYPE_COMPLETE', name: 'Type Complete' },
                        ],
                        transitions: [
                            {
                                from: 'Hidden',
                                to: 'Typing',
                                event: 'SHOW',
                                effects: [
                                    ['set', '@entity.dialogueTree', '@payload.dialogue'],
                                    ['set', '@entity.currentNode', 0],
                                    ['set', '@entity.isTyping', true],
                                    ['set', '@entity.displayedText', ''],
                                    ['set', '@entity.typeIndex', 0],
                                    ['set', '@entity.lastTypeTime', '@now'],
                                    ['emit', 'GAME_PAUSE'],
                                    ['render-ui', 'overlay.dialogue', {
                                        type: 'modal',
                                        title: '@entity.speaker',
                                        content: { text: '@entity.displayedText', isTyping: '@entity.isTyping' },
                                        actions: [
                                            { event: 'NEXT', label: 'Next' },
                                            { event: 'SKIP', label: 'Skip' },
                                        ],
                                    }],
                                ],
                            },
                            {
                                from: 'Typing',
                                to: 'Typing',
                                event: 'TYPE_CHAR',
                                effects: [
                                    ['let', [['currentDialogue', ['array/nth', '@entity.dialogueTree', '@entity.currentNode']]],
                                        ['do',
                                            ['set', '@entity.typeIndex', ['+', '@entity.typeIndex', 1]],
                                            ['set', '@entity.displayedText', ['str/slice', '@currentDialogue.text', 0, '@entity.typeIndex']],
                                            ['set', '@entity.lastTypeTime', '@now']]],
                                ],
                            },
                            {
                                from: 'Typing',
                                to: 'Showing',
                                event: 'TYPE_COMPLETE',
                                effects: [['set', '@entity.isTyping', false]],
                            },
                            {
                                from: 'Typing',
                                to: 'Showing',
                                event: 'SKIP',
                                effects: [
                                    ['let', [['currentDialogue', ['array/nth', '@entity.dialogueTree', '@entity.currentNode']]],
                                        ['do',
                                            ['set', '@entity.isTyping', false],
                                            ['set', '@entity.displayedText', '@currentDialogue.text']]],
                                ],
                            },
                            {
                                from: 'Showing',
                                to: 'Typing',
                                event: 'NEXT',
                                guard: ['not', ['object/get', ['array/nth', '@entity.dialogueTree', '@entity.currentNode'], 'choices']],
                                effects: [
                                    ['if', ['>=', '@entity.currentNode', ['-', ['array/len', '@entity.dialogueTree'], 1]],
                                        ['emit', 'CLOSE'],
                                        ['do',
                                            ['set', '@entity.currentNode', ['+', '@entity.currentNode', 1]],
                                            ['set', '@entity.isTyping', true],
                                            ['set', '@entity.displayedText', ''],
                                            ['set', '@entity.typeIndex', 0]]],
                                ],
                            },
                            {
                                from: 'Showing',
                                to: 'Choice',
                                event: 'NEXT',
                                guard: ['object/get', ['array/nth', '@entity.dialogueTree', '@entity.currentNode'], 'choices'],
                                effects: [
                                    ['let', [['currentDialogue', ['array/nth', '@entity.dialogueTree', '@entity.currentNode']]],
                                        ['render-ui', 'overlay.dialogue', {
                                            type: 'modal',
                                            title: 'Choose',
                                            content: { choices: '@currentDialogue.choices' },
                                        }]],
                                ],
                            },
                            {
                                from: 'Choice',
                                to: 'Typing',
                                event: 'SELECT_CHOICE',
                                effects: [
                                    ['let', [['currentDialogue', ['array/nth', '@entity.dialogueTree', '@entity.currentNode']]],
                                        ['let', [['choice', ['array/nth', '@currentDialogue.choices', '@payload.index']]],
                                            ['do',
                                                ['if', '@choice.nextNode',
                                                    ['set', '@entity.currentNode', '@choice.nextNode'],
                                                    ['set', '@entity.currentNode', ['+', '@entity.currentNode', 1]]],
                                                ['if', '@choice.effect', ['emit', '@choice.effect']]]]],
                                    ['set', '@entity.isTyping', true],
                                    ['set', '@entity.displayedText', ''],
                                    ['set', '@entity.typeIndex', 0],
                                ],
                            },
                            {
                                from: 'Typing',
                                to: 'Hidden',
                                event: 'CLOSE',
                                effects: [
                                    ['set', '@entity.dialogueTree', []],
                                    ['set', '@entity.currentNode', 0],
                                    ['emit', 'GAME_RESUME'],
                                ],
                            },
                            {
                                from: 'Showing',
                                to: 'Hidden',
                                event: 'CLOSE',
                                effects: [
                                    ['set', '@entity.dialogueTree', []],
                                    ['set', '@entity.currentNode', 0],
                                    ['emit', 'GAME_RESUME'],
                                ],
                            },
                            {
                                from: 'Choice',
                                to: 'Hidden',
                                event: 'CLOSE',
                                effects: [
                                    ['set', '@entity.dialogueTree', []],
                                    ['set', '@entity.currentNode', 0],
                                    ['emit', 'GAME_RESUME'],
                                ],
                            },
                        ],
                    },
                    ticks: [
                        {
                            name: 'TypewriterEffect',
                            interval: 'frame',
                            guard: ['and', '@entity.isTyping', ['>', ['-', '@now', '@entity.lastTypeTime'], ['/', 1000, '@entity.typingSpeed']]],
                            effects: [
                                ['let', [['currentDialogue', ['array/nth', '@entity.dialogueTree', '@entity.currentNode']]],
                                    ['if', ['<', '@entity.typeIndex', ['str/len', '@currentDialogue.text']],
                                        ['emit', 'TYPE_CHAR'],
                                        ['emit', 'TYPE_COMPLETE']]],
                            ],
                        },
                    ],
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// std-levelprogress - Level Unlock and Progression
// ============================================================================

/**
 * std-levelprogress - Manages level unlock, selection, and completion.
 */
export const LEVEL_PROGRESS_BEHAVIOR: BehaviorSchema = {
    name: 'std-levelprogress',
    version: '1.0.0',
    description: 'Level progression with unlock, selection, and completion tracking',
    orbitals: [
        {
            name: 'LevelProgressOrbital',
            entity: {
                name: 'LevelProgressState',
                persistence: 'runtime',
                fields: [
                    { name: 'id', type: 'string', required: true },
                    { name: 'currentLevel', type: 'number', default: 0 },
                    { name: 'unlockedLevels', type: 'array', default: [0] },
                    { name: 'levelStars', type: 'object', default: {} },
                    { name: 'totalStars', type: 'number', default: 0 },
                    { name: 'levels', type: 'array', default: [] },
                    { name: 'starsPerLevel', type: 'number', default: 3 },
                    { name: 'unlockNext', type: 'boolean', default: true },
                    { name: 'persistProgress', type: 'boolean', default: true },
                ],
            },
            traits: [
                {
                    name: 'LevelProgress',
                    linkedEntity: 'LevelProgressState',
                    category: 'interaction',
                    stateMachine: {
                        states: [
                            { name: 'Browsing', isInitial: true },
                            { name: 'LevelLoading' },
                            { name: 'InLevel' },
                        ],
                        events: [
                            { key: 'INIT', name: 'Initialize' },
                            { key: 'SELECT_LEVEL', name: 'Select Level' },
                            { key: 'LEVEL_LOADED', name: 'Level Loaded' },
                            { key: 'COMPLETE_LEVEL', name: 'Complete Level' },
                            { key: 'UNLOCK_LEVEL', name: 'Unlock Level' },
                            { key: 'BACK_TO_SELECT', name: 'Back To Select' },
                        ],
                        transitions: [
                            {
                                from: 'Browsing',
                                to: 'Browsing',
                                event: 'INIT',
                                effects: [
                                    ['render-ui', 'screen', {
                                        type: 'entity-table',
                                        entity: 'Level',
                                        title: 'Select Level',
                                        subtitle: 'Total Stars: @entity.totalStars',
                                    }],
                                ],
                            },
                            {
                                from: 'Browsing',
                                to: 'LevelLoading',
                                event: 'SELECT_LEVEL',
                                guard: ['array/includes', '@entity.unlockedLevels', '@payload.levelIndex'],
                                effects: [
                                    ['set', '@entity.currentLevel', '@payload.levelIndex'],
                                    ['emit', 'LOAD_LEVEL', { levelData: ['array/nth', '@entity.levels', '@payload.levelIndex'] }],
                                ],
                            },
                            {
                                from: 'LevelLoading',
                                to: 'InLevel',
                                event: 'LEVEL_LOADED',
                                effects: [['emit', 'START']],
                            },
                            {
                                from: 'InLevel',
                                to: 'InLevel',
                                event: 'COMPLETE_LEVEL',
                                effects: [
                                    ['set', '@entity.levelStars', ['object/set', '@entity.levelStars', ['str/toString', '@entity.currentLevel'],
                                        ['math/max', '@payload.stars', ['object/get', '@entity.levelStars', ['str/toString', '@entity.currentLevel'], 0]]]],
                                    ['set', '@entity.totalStars', ['array/reduce', ['object/values', '@entity.levelStars'], ['fn', 'sum', 'v', ['+', '@sum', '@v']], 0]],
                                    ['if', ['and', '@entity.unlockNext', ['<', '@entity.currentLevel', ['-', ['array/len', '@entity.levels'], 1]]],
                                        ['emit', 'UNLOCK_LEVEL', { levelIndex: ['+', '@entity.currentLevel', 1] }]],
                                    ['if', '@entity.persistProgress',
                                        ['persist', 'save', 'LevelProgress', {
                                            unlockedLevels: '@entity.unlockedLevels',
                                            levelStars: '@entity.levelStars',
                                        }]],
                                ],
                            },
                            {
                                from: 'InLevel',
                                to: 'InLevel',
                                event: 'UNLOCK_LEVEL',
                                guard: ['not', ['array/includes', '@entity.unlockedLevels', '@payload.levelIndex']],
                                effects: [
                                    ['set', '@entity.unlockedLevels', ['array/append', '@entity.unlockedLevels', '@payload.levelIndex']],
                                ],
                            },
                            {
                                from: 'InLevel',
                                to: 'Browsing',
                                event: 'BACK_TO_SELECT',
                                effects: [['emit', 'INIT']],
                            },
                            {
                                from: 'LevelLoading',
                                to: 'Browsing',
                                event: 'INIT',
                                effects: [],
                            },
                            {
                                from: 'InLevel',
                                to: 'Browsing',
                                event: 'INIT',
                                effects: [],
                            },
                        ],
                    },
                },
            ],
            pages: [],
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
