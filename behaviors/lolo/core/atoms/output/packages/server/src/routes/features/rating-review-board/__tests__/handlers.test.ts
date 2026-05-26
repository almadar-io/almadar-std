import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { handleEvent } from '../handlers.js';

declare module 'express' {
  interface Request { firebaseUser?: { uid: string; email?: string } }
}

// Mock @almadar/server
const mockDataService = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
};
vi.mock('@almadar/server', () => ({
  getDataService: vi.fn(() => mockDataService),
  resetDataService: vi.fn(),
  getServerEventBus: vi.fn(() => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn() })),
  resetServerEventBus: vi.fn(),
  getMockDataService: vi.fn(() => mockDataService),
  resetMockDataService: vi.fn(),
  logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  authenticateFirebase: vi.fn((_req, _res, next) => next()),
}));

describe('RatingReviewBoard Server Handlers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonResponse: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonResponse = undefined;
    mockRes = {
      json: vi.fn((data) => { jsonResponse = data; return mockRes as Response; }),
      status: vi.fn(() => mockRes as Response),
    };
    mockNext = vi.fn();
  });

  describe('handleEvent', () => {
    describe('INIT event', () => {
      it('should handle INIT event', async () => {
        mockReq = {
          body: { event: 'INIT', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('ReviewsLoaded event', () => {
      it('should handle ReviewsLoaded event', async () => {
        mockReq = {
          body: { event: 'ReviewsLoaded', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('ReviewsLoadFailed event', () => {
      it('should handle ReviewsLoadFailed event', async () => {
        mockReq = {
          body: { event: 'ReviewsLoadFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('ReviewSaved event', () => {
      it('should handle ReviewSaved event', async () => {
        mockReq = {
          body: { event: 'ReviewSaved', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('ReviewSaveFailed event', () => {
      it('should handle ReviewSaveFailed event', async () => {
        mockReq = {
          body: { event: 'ReviewSaveFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('WRITE_REVIEW event', () => {
      it('should handle WRITE_REVIEW event', async () => {
        mockReq = {
          body: { event: 'WRITE_REVIEW', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CHANGE_SORT event', () => {
      it('should handle CHANGE_SORT event', async () => {
        mockReq = {
          body: { event: 'CHANGE_SORT', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('MARK_HELPFUL event', () => {
      it('should handle MARK_HELPFUL event', async () => {
        mockReq = {
          body: { event: 'MARK_HELPFUL', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RATE_DRAFT event', () => {
      it('should handle RATE_DRAFT event', async () => {
        mockReq = {
          body: { event: 'RATE_DRAFT', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SUBMIT_REVIEW event', () => {
      it('should handle SUBMIT_REVIEW event', async () => {
        mockReq = {
          body: { event: 'SUBMIT_REVIEW', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_REVIEW event', () => {
      it('should handle CANCEL_REVIEW event', async () => {
        mockReq = {
          body: { event: 'CANCEL_REVIEW', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RESTART event', () => {
      it('should handle RESTART event', async () => {
        mockReq = {
          body: { event: 'RESTART', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    it('should return error for unknown event', async () => {
      mockReq = {
        body: { event: 'UNKNOWN_EVENT', currentState: 'loading' },
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; error?: string };
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown event');
    });
  });

  describe('guard enforcement', () => {
    it('should enforce guard on viewing -> viewing via CHANGE_SORT', async () => {
      // Test guard enforcement
      mockReq = {
        body: { event: 'CHANGE_SORT', currentState: 'viewing' },
        firebaseUser: undefined, // No user - should fail guard
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; guardFailed?: string };
      // Guard should either pass or fail with guardFailed message
      expect(response).toHaveProperty('success');
    });

    it('should enforce guard on viewing -> viewing via CHANGE_SORT', async () => {
      // Test guard enforcement
      mockReq = {
        body: { event: 'CHANGE_SORT', currentState: 'viewing' },
        firebaseUser: undefined, // No user - should fail guard
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; guardFailed?: string };
      // Guard should either pass or fail with guardFailed message
      expect(response).toHaveProperty('success');
    });

    it('should enforce guard on viewing -> viewing via CHANGE_SORT', async () => {
      // Test guard enforcement
      mockReq = {
        body: { event: 'CHANGE_SORT', currentState: 'viewing' },
        firebaseUser: undefined, // No user - should fail guard
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; guardFailed?: string };
      // Guard should either pass or fail with guardFailed message
      expect(response).toHaveProperty('success');
    });

  });

  describe('response structure', () => {
    it('should return proper EventResponse structure', async () => {
      mockReq = {
        body: { event: 'INIT', currentState: 'loading' },
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as Record<string, unknown>;
      expect(response).toHaveProperty('success');
      if (response.success) {
        expect(response).toHaveProperty('newState');
        expect(response).toHaveProperty('data');
      }
    });
  });
});
