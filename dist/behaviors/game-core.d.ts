/**
 * Game Core Behaviors
 *
 * Foundation behaviors for game systems: loop, physics, input, collision.
 * These use the Trait architecture with stateMachine and ticks.
 *
 * @packageDocumentation
 */
import type { StandardBehavior } from './types.js';
/**
 * std/GameLoop - Coordinates game tick execution at 60fps.
 *
 * States: Running, Paused
 * Provides the master clock for all game systems.
 */
export declare const GAME_LOOP_BEHAVIOR: StandardBehavior;
/**
 * std/Physics2D - 2D physics with gravity, velocity, and friction.
 *
 * Applied to entities that need physics simulation.
 */
export declare const PHYSICS_2D_BEHAVIOR: StandardBehavior;
/**
 * std/Input - Manages keyboard and touch input state.
 *
 * Singleton behavior that tracks all input state.
 */
export declare const INPUT_BEHAVIOR: StandardBehavior;
/**
 * std/Collision - Handles collision detection and response.
 *
 * Configures how an entity responds to collisions.
 */
export declare const COLLISION_BEHAVIOR: StandardBehavior;
export declare const GAME_CORE_BEHAVIORS: StandardBehavior[];
