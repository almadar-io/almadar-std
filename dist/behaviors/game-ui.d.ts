/**
 * Game UI Behaviors
 *
 * Game interface behaviors: flow, dialogue, level progression.
 * These use the Trait architecture with stateMachine and ticks.
 *
 * @packageDocumentation
 */
import type { StandardBehavior } from './types.js';
/**
 * std/GameFlow - Master game state management.
 *
 * States: Menu → Playing → Paused → GameOver/Victory
 */
export declare const GAME_FLOW_BEHAVIOR: StandardBehavior;
/**
 * std/Dialogue - Manages NPC dialogue and branching conversations.
 */
export declare const DIALOGUE_BEHAVIOR: StandardBehavior;
/**
 * std/LevelProgress - Manages level unlock, selection, and completion.
 */
export declare const LEVEL_PROGRESS_BEHAVIOR: StandardBehavior;
export declare const GAME_UI_BEHAVIORS: StandardBehavior[];
