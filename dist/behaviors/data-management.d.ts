/**
 * Data Management Behaviors
 *
 * Standard behaviors for data operations like pagination, selection,
 * sorting, filtering, and search.
 *
 * @packageDocumentation
 */
import type { StandardBehavior } from './types.js';
/**
 * std/Pagination - Page navigation behavior for large data sets.
 */
export declare const PAGINATION_BEHAVIOR: StandardBehavior;
export declare const SELECTION_BEHAVIOR: StandardBehavior;
export declare const SORT_BEHAVIOR: StandardBehavior;
/**
 * std/Filter - Query Singleton pattern for explicit filtering.
 *
 * This behavior uses a singleton entity to hold filter state, making filtering
 * explicit in the schema rather than implicit in component behavior.
 *
 * The query singleton is referenced by patterns via the `query` prop:
 * ```json
 * { "type": "entity-table", "entity": "Task", "query": "@TaskQuery" }
 * ```
 */
export declare const FILTER_BEHAVIOR: StandardBehavior;
/**
 * std/Search - Search with debounce.
 *
 * Uses a singleton to hold search state. Can be combined with std/Filter
 * for full query singleton functionality, or used standalone.
 */
export declare const SEARCH_BEHAVIOR: StandardBehavior;
export declare const DATA_MANAGEMENT_BEHAVIORS: StandardBehavior[];
