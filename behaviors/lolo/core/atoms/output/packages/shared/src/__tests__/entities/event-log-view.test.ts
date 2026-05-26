import { describe, it, expect } from 'vitest';
import type { EventLogView, EventLogViewInput } from '../../types/entities.js';
import { eventLogViewSchema, eventLogViewInputSchema, eventLogViewUpdateSchema } from '../../schemas/entities.js';

describe('EventLogView Entity', () => {
  describe('eventLogViewSchema', () => {
    it('should validate a complete entity', () => {
      const validEventLogView: EventLogView = {
        id: 'test-id',
        title: 'test-value',
        description: 'test-value',
        kind: 'test-value',
        date: 'test-value',
        allEntries: [],
        entries: [],
        filterChips: [],
        filterKind: 'test-value',
        backfillTitle: 'test-value',
        backfillDescription: 'test-value',
        backfillDate: 'test-value',
        backfillKind: 'test-value',
        errorMessage: 'test-value',
      };
      const result = eventLogViewSchema.safeParse(validEventLogView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as EventLogView;
      const result = eventLogViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('eventLogViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: EventLogViewInput = {
        title: 'test-value',
        description: 'test-value',
        kind: 'test-value',
        date: 'test-value',
        allEntries: [],
        entries: [],
        filterChips: [],
        filterKind: 'test-value',
        backfillTitle: 'test-value',
        backfillDescription: 'test-value',
        backfillDate: 'test-value',
        backfillKind: 'test-value',
        errorMessage: 'test-value',
      };
      const result = eventLogViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('eventLogViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        title: 'test-value',
      };
      const result = eventLogViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = eventLogViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('id');
    });

    it('should have title field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('title');
    });

    it('should have description field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('description');
    });

    it('should have kind field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('kind');
    });

    it('should have date field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('date');
    });

    it('should have allEntries field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('allEntries');
    });

    it('should have entries field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('entries');
    });

    it('should have filterChips field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('filterChips');
    });

    it('should have filterKind field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('filterKind');
    });

    it('should have backfillTitle field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('backfillTitle');
    });

    it('should have backfillDescription field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('backfillDescription');
    });

    it('should have backfillDate field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('backfillDate');
    });

    it('should have backfillKind field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('backfillKind');
    });

    it('should have errorMessage field in schema', () => {
      expect(eventLogViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
