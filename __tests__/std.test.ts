import { describe, it, expect } from 'vitest';
import {
    // Operators
    STD_OPERATORS,
    isKnownStdOperator,
    getModuleOperators,
    getAllStdOperators,
    getStdLibStats,
    STD_MODULES,
} from '../index';

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
