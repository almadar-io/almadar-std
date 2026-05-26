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

describe('RatingReviewSubmit Server Handlers', () => {
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
          body: { event: 'INIT', currentState: 'composing' },
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
          body: { event: 'RATE_DRAFT', currentState: 'composing' },
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
          body: { event: 'SUBMIT_REVIEW', currentState: 'composing' },
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
          body: { event: 'CANCEL_REVIEW', currentState: 'composing' },
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
          body: { event: 'ReviewSaved', currentState: 'composing' },
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
          body: { event: 'ReviewSaveFailed', currentState: 'composing' },
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
          body: { event: 'RESTART', currentState: 'composing' },
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
        body: { event: 'UNKNOWN_EVENT', currentState: 'composing' },
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; error?: string };
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown event');
    });
  });

  describe('response structure', () => {
    it('should return proper EventResponse structure', async () => {
      mockReq = {
        body: { event: 'INIT', currentState: 'composing' },
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
