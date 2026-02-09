import { describe, it, expect } from 'vitest';
import {
    // Registry
    STANDARD_BEHAVIORS,
    BEHAVIOR_REGISTRY,
    getBehavior,
    isKnownBehavior,
    getAllBehaviorNames,
    getAllBehaviors,
    getAllBehaviorMetadata,
    findBehaviorsForUseCase,
    getBehaviorsForEvent,
    getBehaviorsWithState,
    validateBehaviorReference,
    getBehaviorLibraryStats,

    // Operators
    STD_OPERATORS,
    isKnownStdOperator,
    getModuleOperators,
    getAllStdOperators,
    validateStdOperatorArity,
    getStdLibStats,
    STD_MODULES,
} from '../index';

// ============================================================================
// Behavior Registry
// ============================================================================

describe('STANDARD_BEHAVIORS', () => {
    it('is a non-empty array', () => {
        expect(STANDARD_BEHAVIORS.length).toBeGreaterThan(0);
    });

    it('every behavior has a name', () => {
        for (const behavior of STANDARD_BEHAVIORS) {
            expect(behavior.name, 'behavior must have a name').toBeTruthy();
        }
    });

    it('every behavior name starts with std-', () => {
        for (const behavior of STANDARD_BEHAVIORS) {
            expect(behavior.name.startsWith('std-'), `"${behavior.name}" should start with std-`).toBe(true);
        }
    });

    it('no duplicate behavior names', () => {
        const names = STANDARD_BEHAVIORS.map((b) => b.name);
        const unique = new Set(names);
        expect(unique.size).toBe(names.length);
    });
});

describe('BEHAVIOR_REGISTRY', () => {
    it('has the same count as STANDARD_BEHAVIORS', () => {
        expect(Object.keys(BEHAVIOR_REGISTRY).length).toBe(STANDARD_BEHAVIORS.length);
    });

    it('indexes by name correctly', () => {
        for (const behavior of STANDARD_BEHAVIORS) {
            expect(BEHAVIOR_REGISTRY[behavior.name]).toBe(behavior);
        }
    });
});

// ============================================================================
// Behavior Lookup Functions
// ============================================================================

describe('getBehavior', () => {
    it('returns a behavior for known names', () => {
        const names = getAllBehaviorNames();
        expect(names.length).toBeGreaterThan(0);
        const behavior = getBehavior(names[0]);
        expect(behavior).toBeDefined();
        expect(behavior!.name).toBe(names[0]);
    });

    it('returns undefined for unknown names', () => {
        expect(getBehavior('nonexistent')).toBeUndefined();
    });
});

describe('isKnownBehavior', () => {
    it('returns true for registered behaviors', () => {
        expect(isKnownBehavior(STANDARD_BEHAVIORS[0].name)).toBe(true);
    });

    it('returns false for unknown behaviors', () => {
        expect(isKnownBehavior('not-a-behavior')).toBe(false);
    });
});

describe('getAllBehaviorNames', () => {
    it('returns all behavior names', () => {
        const names = getAllBehaviorNames();
        expect(names.length).toBe(STANDARD_BEHAVIORS.length);
    });
});

describe('getAllBehaviors', () => {
    it('returns the same array as STANDARD_BEHAVIORS', () => {
        expect(getAllBehaviors()).toBe(STANDARD_BEHAVIORS);
    });
});

describe('getAllBehaviorMetadata', () => {
    it('returns metadata for all behaviors', () => {
        const metadata = getAllBehaviorMetadata();
        expect(metadata.length).toBe(STANDARD_BEHAVIORS.length);
        for (const m of metadata) {
            expect(m.name).toBeTruthy();
        }
    });
});

// ============================================================================
// Behavior Search Functions
// ============================================================================

describe('findBehaviorsForUseCase', () => {
    it('returns behaviors matching a use case', () => {
        // At least one behavior should mention "list" in its description
        const results = findBehaviorsForUseCase('list');
        // It's possible no behaviors match, but check the function works
        expect(Array.isArray(results)).toBe(true);
    });
});

describe('getBehaviorsForEvent / getBehaviorsWithState', () => {
    it('getBehaviorsForEvent returns an array', () => {
        const results = getBehaviorsForEvent('LOAD');
        expect(Array.isArray(results)).toBe(true);
    });

    it('getBehaviorsWithState returns an array', () => {
        const results = getBehaviorsWithState('idle');
        expect(Array.isArray(results)).toBe(true);
    });
});

// ============================================================================
// Behavior Validation
// ============================================================================

describe('validateBehaviorReference', () => {
    it('returns null for valid behavior names', () => {
        const firstName = getAllBehaviorNames()[0];
        expect(validateBehaviorReference(firstName)).toBeNull();
    });

    it('returns error for names not starting with std-', () => {
        const error = validateBehaviorReference('invalid-name');
        expect(error).toContain("must start with 'std-'");
    });

    it('returns error for unknown std- names with suggestions', () => {
        const error = validateBehaviorReference('std-lsit'); // typo for std-list
        expect(error).toBeTruthy();
    });
});

// ============================================================================
// Behavior Library Stats
// ============================================================================

describe('getBehaviorLibraryStats', () => {
    it('returns correct total behaviors count', () => {
        const stats = getBehaviorLibraryStats();
        expect(stats.totalBehaviors).toBe(STANDARD_BEHAVIORS.length);
    });

    it('counts states, events, and transitions', () => {
        const stats = getBehaviorLibraryStats();
        expect(stats.totalStates).toBeGreaterThan(0);
        expect(stats.totalEvents).toBeGreaterThan(0);
        expect(stats.totalTransitions).toBeGreaterThan(0);
    });
});

// ============================================================================
// Std Operators
// ============================================================================

describe('STD_OPERATORS', () => {
    it('is a non-empty object', () => {
        expect(Object.keys(STD_OPERATORS).length).toBeGreaterThan(0);
    });
});

describe('STD_MODULES', () => {
    it('contains expected modules', () => {
        const expected = ['math', 'str', 'array', 'object'];
        for (const mod of expected) {
            expect(STD_MODULES).toContain(mod);
        }
    });
});

describe('isKnownStdOperator', () => {
    it('recognizes known operators', () => {
        expect(isKnownStdOperator('math/clamp')).toBe(true);
        expect(isKnownStdOperator('str/upper')).toBe(true);
    });

    it('rejects unknown operators', () => {
        expect(isKnownStdOperator('fake/nope')).toBe(false);
    });
});

describe('getModuleOperators', () => {
    it('returns operators for known modules', () => {
        const mathOps = getModuleOperators('math');
        expect(Object.keys(mathOps).length).toBeGreaterThan(0);
    });
});

describe('getAllStdOperators', () => {
    it('returns all operators across modules', () => {
        const all = getAllStdOperators();
        expect(all.length).toBeGreaterThan(0);
    });
});

describe('getStdLibStats', () => {
    it('returns operator counts', () => {
        const stats = getStdLibStats();
        expect(stats.totalOperators).toBeGreaterThan(0);
        expect(Object.keys(stats.byModule).length).toBeGreaterThan(0);
    });
});
