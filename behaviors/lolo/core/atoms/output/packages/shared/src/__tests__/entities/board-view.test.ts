import { describe, it, expect } from 'vitest';
import type { BoardView, BoardViewInput } from '../../types/entities.js';
import { boardViewSchema, boardViewInputSchema, boardViewUpdateSchema } from '../../schemas/entities.js';

describe('BoardView Entity', () => {
  describe('boardViewSchema', () => {
    it('should validate a complete entity', () => {
      const validBoardView: BoardView = {
        id: 'test-id',
        title: 'test-value',
        description: 'test-value',
        stage: 'test-value',
        notes: 'test-value',
        position: 42,
        boards: [],
        currentId: 'test-value',
        currentTitle: 'test-value',
        currentDescription: 'test-value',
        currentStage: 'test-value',
        currentNotes: 'test-value',
        errorMessage: 'test-value',
      };
      const result = boardViewSchema.safeParse(validBoardView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as BoardView;
      const result = boardViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('boardViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: BoardViewInput = {
        title: 'test-value',
        description: 'test-value',
        stage: 'test-value',
        notes: 'test-value',
        position: 42,
        boards: [],
        currentId: 'test-value',
        currentTitle: 'test-value',
        currentDescription: 'test-value',
        currentStage: 'test-value',
        currentNotes: 'test-value',
        errorMessage: 'test-value',
      };
      const result = boardViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('boardViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        title: 'test-value',
      };
      const result = boardViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = boardViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('id');
    });

    it('should have title field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('title');
    });

    it('should have description field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('description');
    });

    it('should have stage field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('stage');
    });

    it('should have notes field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('notes');
    });

    it('should have position field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('position');
    });

    it('should have boards field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('boards');
    });

    it('should have currentId field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('currentId');
    });

    it('should have currentTitle field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('currentTitle');
    });

    it('should have currentDescription field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('currentDescription');
    });

    it('should have currentStage field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('currentStage');
    });

    it('should have currentNotes field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('currentNotes');
    });

    it('should have errorMessage field in schema', () => {
      expect(boardViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
