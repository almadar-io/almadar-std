import { describe, it, expect } from 'vitest';
import type { ReviewView, ReviewViewInput } from '../../types/entities.js';
import { reviewViewSchema, reviewViewInputSchema, reviewViewUpdateSchema } from '../../schemas/entities.js';

describe('ReviewView Entity', () => {
  describe('reviewViewSchema', () => {
    it('should validate a complete entity', () => {
      const validReviewView: ReviewView = {
        id: 'test-id',
        reviews: [],
        reviewsSource: [],
        totalReviews: 42,
        averageRating: 42,
        starDistribution: [],
        currentSort: 'test-value',
        draftRating: 42,
        draftComment: 'test-value',
        errorMessage: 'test-value',
      };
      const result = reviewViewSchema.safeParse(validReviewView);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity (missing id)', () => {
      const invalid = { } as unknown as ReviewView;
      const result = reviewViewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('reviewViewInputSchema', () => {
    it('should validate input for creation', () => {
      const input: ReviewViewInput = {
        reviews: [],
        reviewsSource: [],
        totalReviews: 42,
        averageRating: 42,
        starDistribution: [],
        currentSort: 'test-value',
        draftRating: 42,
        draftComment: 'test-value',
        errorMessage: 'test-value',
      };
      const result = reviewViewInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('reviewViewUpdateSchema', () => {
    it('should validate partial update (all fields optional)', () => {
      const partialUpdate = {
        reviews: [],
      };
      const result = reviewViewUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = reviewViewUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('type structure', () => {
    it('should have id field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('id');
    });

    it('should have reviews field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('reviews');
    });

    it('should have reviewsSource field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('reviewsSource');
    });

    it('should have totalReviews field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('totalReviews');
    });

    it('should have averageRating field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('averageRating');
    });

    it('should have starDistribution field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('starDistribution');
    });

    it('should have currentSort field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('currentSort');
    });

    it('should have draftRating field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('draftRating');
    });

    it('should have draftComment field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('draftComment');
    });

    it('should have errorMessage field in schema', () => {
      expect(reviewViewSchema.shape).toHaveProperty('errorMessage');
    });

  });
});
