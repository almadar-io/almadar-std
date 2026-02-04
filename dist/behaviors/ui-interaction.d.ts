/**
 * UI Interaction Behaviors
 *
 * Standard behaviors for common UI interaction patterns.
 * These use the Trait architecture with stateMachine.
 *
 * IMPORTANT: These are GENERATION TEMPLATES for LLMs.
 * They must use correct syntax:
 * - render-ui (not render)
 * - Explicit from states (not '*')
 * - Valid pattern types (form-section, entity-detail, etc.)
 *
 * @packageDocumentation
 */
import type { StandardBehavior } from './types.js';
/**
 * std/List - The core behavior for displaying and interacting with entity collections.
 *
 * States: Browsing → Creating/Viewing/Editing/Deleting
 * Implements complete CRUD operations with modal/drawer UI patterns.
 */
export declare const LIST_BEHAVIOR: StandardBehavior;
export declare const DETAIL_BEHAVIOR: StandardBehavior;
export declare const FORM_BEHAVIOR: StandardBehavior;
export declare const MODAL_BEHAVIOR: StandardBehavior;
export declare const DRAWER_BEHAVIOR: StandardBehavior;
export declare const TABS_BEHAVIOR: StandardBehavior;
export declare const WIZARD_BEHAVIOR: StandardBehavior;
export declare const MASTER_DETAIL_BEHAVIOR: StandardBehavior;
export declare const FILTER_BEHAVIOR: StandardBehavior;
export declare const UI_INTERACTION_BEHAVIORS: StandardBehavior[];
