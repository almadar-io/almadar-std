import { describe, it, expect } from 'vitest';
import type { MultiPartyView, MultiPartyViewInput } from '../../types/entities.js';
import { multiPartyViewSchema, multiPartyViewInputSchema, multiPartyViewUpdateSchema } from '../../schemas/entities.js';

describe('MultiPartyView Entity', () => {
  describe('multiPartyViewSchema', () => {
    it('should validate a complete entity', () => {
      const validMultiPartyView: MultiPartyView = {
        id: 'test-id',
        parties: [],
        currentPartyIndex: 42,
        totalParties: 42,
        currentPartyId: 'test-value',
        currentPartyTitle: 'test-value',
        currentPartyActor: 'test-value',
        currentPartyIcon: 'test-value',
        currentActionLabel: 'test-value',
        currentActionIcon: 'test-value',
        currentActionDescription: 'test-value',
        currentStepLabel: 'test-value',
        audit: [],
        reason: 'test-value',
        disputeReason: 'test-value',
        cancelReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = multiPartyViewSchema.safeParse(validMultiPartyView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as MultiPartyView;
      const result = multiPartyViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('multiPartyViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: MultiPartyViewInput = {
        parties: [],
        currentPartyIndex: 42,
        totalParties: 42,
        currentPartyId: 'test-value',
        currentPartyTitle: 'test-value',
        currentPartyActor: 'test-value',
        currentPartyIcon: 'test-value',
        currentActionLabel: 'test-value',
        currentActionIcon: 'test-value',
        currentActionDescription: 'test-value',
        currentStepLabel: 'test-value',
        audit: [],
        reason: 'test-value',
        disputeReason: 'test-value',
        cancelReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = multiPartyViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('multiPartyViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        parties: [],
      };
      const result = multiPartyViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = multiPartyViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('id');
    });

    it('should have parties field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('parties');
    });

    it('should have currentPartyIndex field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentPartyIndex');
    });

    it('should have totalParties field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('totalParties');
    });

    it('should have currentPartyId field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentPartyId');
    });

    it('should have currentPartyTitle field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentPartyTitle');
    });

    it('should have currentPartyActor field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentPartyActor');
    });

    it('should have currentPartyIcon field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentPartyIcon');
    });

    it('should have currentActionLabel field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentActionLabel');
    });

    it('should have currentActionIcon field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentActionIcon');
    });

    it('should have currentActionDescription field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentActionDescription');
    });

    it('should have currentStepLabel field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('currentStepLabel');
    });

    it('should have audit field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('audit');
    });

    it('should have reason field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('reason');
    });

    it('should have disputeReason field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('disputeReason');
    });

    it('should have cancelReason field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('cancelReason');
    });

    it('should have errorMessage field in schema', () => {
      expect(multiPartyViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
