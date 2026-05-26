import { describe, it, expect } from 'vitest';
import type { RecurrenceView, RecurrenceViewInput } from '../../types/entities.js';
import { recurrenceViewSchema, recurrenceViewInputSchema, recurrenceViewUpdateSchema } from '../../schemas/entities.js';

describe('RecurrenceView Entity', () => {
  describe('recurrenceViewSchema', () => {
    it('should validate a complete entity', () => {
      const validRecurrenceView: RecurrenceView = {
        id: 'test-id',
        title: 'test-value',
        notes: 'test-value',
        date: 'test-value',
        occurrences: [],
        frequency: 'test-value',
        interval: 42,
        startDate: 'test-value',
        endDate: 'test-value',
        endAfterCount: 42,
        summaryText: 'test-value',
        currentOccurrenceId: 'test-value',
        currentOccurrenceDate: 'test-value',
        currentOccurrenceLabel: 'test-value',
        rescheduleDate: 'test-value',
        skipReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = recurrenceViewSchema.safeParse(validRecurrenceView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as RecurrenceView;
      const result = recurrenceViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('recurrenceViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: RecurrenceViewInput = {
        title: 'test-value',
        notes: 'test-value',
        date: 'test-value',
        occurrences: [],
        frequency: 'test-value',
        interval: 42,
        startDate: 'test-value',
        endDate: 'test-value',
        endAfterCount: 42,
        summaryText: 'test-value',
        currentOccurrenceId: 'test-value',
        currentOccurrenceDate: 'test-value',
        currentOccurrenceLabel: 'test-value',
        rescheduleDate: 'test-value',
        skipReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = recurrenceViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('recurrenceViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        title: 'test-value',
      };
      const result = recurrenceViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = recurrenceViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('id');
    });

    it('should have title field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('title');
    });

    it('should have notes field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('notes');
    });

    it('should have date field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('date');
    });

    it('should have occurrences field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('occurrences');
    });

    it('should have frequency field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('frequency');
    });

    it('should have interval field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('interval');
    });

    it('should have startDate field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('startDate');
    });

    it('should have endDate field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('endDate');
    });

    it('should have endAfterCount field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('endAfterCount');
    });

    it('should have summaryText field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('summaryText');
    });

    it('should have currentOccurrenceId field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('currentOccurrenceId');
    });

    it('should have currentOccurrenceDate field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('currentOccurrenceDate');
    });

    it('should have currentOccurrenceLabel field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('currentOccurrenceLabel');
    });

    it('should have rescheduleDate field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('rescheduleDate');
    });

    it('should have skipReason field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('skipReason');
    });

    it('should have errorMessage field in schema', () => {
      expect(recurrenceViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
