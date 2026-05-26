import { describe, it, expect } from 'vitest';
import type { StepFlowView, StepFlowViewInput } from '../../types/entities.js';
import { stepFlowViewSchema, stepFlowViewInputSchema, stepFlowViewUpdateSchema } from '../../schemas/entities.js';

describe('StepFlowView Entity', () => {
  describe('stepFlowViewSchema', () => {
    it('should validate a complete entity', () => {
      const validStepFlowView: StepFlowView = {
        id: 'test-id',
        wizardSteps: [],
        currentStepIndex: 42,
        totalSteps: 42,
        currentStepLabel: 'test-value',
        currentStepDescription: 'test-value',
        currentStepIcon: 'test-value',
        isFirstStep: false,
        isLastStep: false,
        primaryActionLabel: 'test-value',
        primaryActionVariant: 'test-value',
        primaryActionIcon: 'test-value',
        finalStatus: 'test-value',
        rejectionReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = stepFlowViewSchema.safeParse(validStepFlowView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as StepFlowView;
      const result = stepFlowViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('stepFlowViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: StepFlowViewInput = {
        wizardSteps: [],
        currentStepIndex: 42,
        totalSteps: 42,
        currentStepLabel: 'test-value',
        currentStepDescription: 'test-value',
        currentStepIcon: 'test-value',
        isFirstStep: false,
        isLastStep: false,
        primaryActionLabel: 'test-value',
        primaryActionVariant: 'test-value',
        primaryActionIcon: 'test-value',
        finalStatus: 'test-value',
        rejectionReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = stepFlowViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('stepFlowViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        wizardSteps: [],
      };
      const result = stepFlowViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = stepFlowViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('id');
    });

    it('should have wizardSteps field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('wizardSteps');
    });

    it('should have currentStepIndex field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('currentStepIndex');
    });

    it('should have totalSteps field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('totalSteps');
    });

    it('should have currentStepLabel field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('currentStepLabel');
    });

    it('should have currentStepDescription field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('currentStepDescription');
    });

    it('should have currentStepIcon field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('currentStepIcon');
    });

    it('should have isFirstStep field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('isFirstStep');
    });

    it('should have isLastStep field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('isLastStep');
    });

    it('should have primaryActionLabel field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('primaryActionLabel');
    });

    it('should have primaryActionVariant field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('primaryActionVariant');
    });

    it('should have primaryActionIcon field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('primaryActionIcon');
    });

    it('should have finalStatus field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('finalStatus');
    });

    it('should have rejectionReason field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('rejectionReason');
    });

    it('should have errorMessage field in schema', () => {
      expect(stepFlowViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
