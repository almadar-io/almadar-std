/**
 * Standard Library Documentation Generator
 *
 * Generates documentation data from the std library source.
 * Parses modules and behaviors to produce structured JSON for docs.
 *
 * @packageDocumentation
 */
import type { StdOperatorMeta, StdModule } from './types.js';
import type { StandardBehavior, BehaviorCategory } from './behaviors/types.js';
/**
 * Human-friendly module descriptions
 */
export declare const MODULE_DESCRIPTIONS: Record<StdModule, ModuleInfo>;
/**
 * Human-friendly behavior category descriptions
 */
export declare const BEHAVIOR_CATEGORY_DESCRIPTIONS: Partial<Record<BehaviorCategory, CategoryInfo>>;
export interface ModuleInfo {
    name: string;
    displayName: string;
    description: string;
    icon: string;
}
export interface CategoryInfo {
    name: string;
    description: string;
    icon: string;
}
export interface OperatorDoc {
    name: string;
    shortName: string;
    displayName: string;
    description: string;
    params: Array<{
        name: string;
        type: string;
        description: string;
        optional?: boolean;
        defaultValue?: unknown;
    }>;
    example: string;
    returnType: string;
    returnTypeHuman: string;
    arityHuman: string;
    minArity: number;
    maxArity: number | null;
    hasSideEffects: boolean;
    acceptsLambda: boolean;
    pureFunction: boolean;
}
export interface ModuleDoc {
    id: StdModule;
    name: string;
    displayName: string;
    description: string;
    icon: string;
    operators: OperatorDoc[];
    operatorCount: number;
}
export interface BehaviorTransitionDoc {
    from: string | string[] | '*';
    to?: string;
    event: string;
    guard?: unknown;
    effects?: unknown[];
}
export interface BehaviorStateMachineDoc {
    states: Array<{
        name: string;
        isInitial?: boolean;
        isFinal?: boolean;
    }>;
    transitions: BehaviorTransitionDoc[];
}
export interface BehaviorDoc {
    name: string;
    shortName: string;
    description: string;
    suggestedFor: string[];
    states: string[];
    statesCount: number;
    initial: string;
    events: string[];
    eventsCount: number;
    hasFields: boolean;
    hasComputed: boolean;
    hasTicks: boolean;
    ticksCount: number;
    transitionsCount: number;
    /** Full state machine data for visualizer */
    stateMachine?: BehaviorStateMachineDoc;
    /** Full behavior source code for display */
    sourceCode?: string;
    /** Data entities (runtime state) */
    dataEntities?: Array<{
        name: string;
        fields: Array<{
            name: string;
            type: string;
            default?: unknown;
        }>;
    }>;
    /** Ticks (frame-by-frame execution) */
    ticks?: Array<{
        name: string;
        interval: string | number;
        description?: string;
    }>;
}
export interface CategoryDoc {
    id: string;
    name: string;
    description: string;
    icon: string;
    behaviors: BehaviorDoc[];
    behaviorCount: number;
}
export interface DocsStats {
    totalModules: number;
    totalOperators: number;
    totalBehaviorCategories: number;
    totalBehaviors: number;
    generatedAt: string;
}
export interface StdLibDocs {
    modules: ModuleDoc[];
    stats: DocsStats;
}
export interface BehaviorsDocs {
    categories: CategoryDoc[];
    stats: DocsStats;
}
/**
 * Transform operator name to human-friendly format
 * e.g., "math/clamp" -> "Clamp Value"
 */
export declare function humanizeOperatorName(operatorName: string): string;
/**
 * Transform return type to human-friendly format
 */
export declare function humanizeReturnType(returnType: string | undefined): string;
/**
 * Format arity as human-readable text
 */
export declare function formatArity(minArity: number, maxArity: number | null): string;
/**
 * Generate documentation for a single operator
 */
export declare function generateOperatorDoc(opName: string, meta: StdOperatorMeta): OperatorDoc;
/**
 * Generate documentation for a single module
 */
export declare function generateModuleDoc(moduleId: StdModule): ModuleDoc | null;
/**
 * Generate documentation for a single behavior
 */
export declare function generateBehaviorDoc(behavior: StandardBehavior): BehaviorDoc;
/**
 * Generate documentation for all std library modules
 */
export declare function generateModulesDocs(): StdLibDocs;
/**
 * Generate documentation for all standard behaviors
 */
export declare function generateBehaviorsDocs(): BehaviorsDocs;
/**
 * Generate complete standard library documentation
 */
export declare function generateStdLibDocs(): {
    modules: StdLibDocs;
    behaviors: BehaviorsDocs;
};
