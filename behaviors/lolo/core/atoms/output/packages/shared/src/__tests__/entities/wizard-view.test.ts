import { describe, it, expect } from 'vitest';
import type { WizardView, WizardViewInput } from '../../types/entities.js';
import { wizardViewSchema, wizardViewInputSchema, wizardViewUpdateSchema } from '../../schemas/entities.js';

describe('WizardView Entity', () => {
  describe('wizardViewSchema', () => {
    it('should validate a complete entity', () => {
      const validWizardView: WizardView = {
        id: 'test-id',
        title: 'test-value',
        description: 'test-value',
        category: 'test-value',
        priority: 'test-value',
        notes: 'test-value',
        wizardSteps: [],
        currentStepIndex: 42,
        totalSteps: 42,
        currentStepLabel: 'test-value',
        currentStepDescription: 'test-value',
        currentStepIcon: 'test-value',
        currentFields: [],
        isFirstStep: false,
        isLastStep: false,
        primaryActionLabel: 'test-value',
        primaryActionIcon: 'test-value',
        completionMessage: 'test-value',
        cancelReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = wizardViewSchema.safeParse(validWizardView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as WizardView;
      const result = wizardViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('wizardViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: WizardViewInput = {
        title: 'test-value',
        description: 'test-value',
        category: 'test-value',
        priority: 'test-value',
        notes: 'test-value',
        wizardSteps: [],
        currentStepIndex: 42,
        totalSteps: 42,
        currentStepLabel: 'test-value',
        currentStepDescription: 'test-value',
        currentStepIcon: 'test-value',
        currentFields: [],
        isFirstStep: false,
        isLastStep: false,
        primaryActionLabel: 'test-value',
        primaryActionIcon: 'test-value',
        completionMessage: 'test-value',
        cancelReason: 'test-value',
        errorMessage: 'test-value',
      };
      const result = wizardViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('wizardViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        title: 'test-value',
      };
      const result = wizardViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = wizardViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('id');
    });

    it('should have title field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('title');
    });

    it('should have description field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('description');
    });

    it('should have category field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('category');
    });

    it('should have priority field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('priority');
    });

    it('should have notes field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('notes');
    });

    it('should have wizardSteps field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('wizardSteps');
    });

    it('should have currentStepIndex field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('currentStepIndex');
    });

    it('should have totalSteps field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('totalSteps');
    });

    it('should have currentStepLabel field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('currentStepLabel');
    });

    it('should have currentStepDescription field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('currentStepDescription');
    });

    it('should have currentStepIcon field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('currentStepIcon');
    });

    it('should have currentFields field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('currentFields');
    });

    it('should have isFirstStep field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('isFirstStep');
    });

    it('should have isLastStep field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('isLastStep');
    });

    it('should have primaryActionLabel field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('primaryActionLabel');
    });

    it('should have primaryActionIcon field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('primaryActionIcon');
    });

    it('should have completionMessage field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('completionMessage');
    });

    it('should have cancelReason field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('cancelReason');
    });

    it('should have errorMessage field in schema', () => {
      expect(wizardViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
