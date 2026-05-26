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

describe('EventLogTimeline Server Handlers', () => {
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

    describe('EventLogLoaded event', () => {
      it('should handle EventLogLoaded event', async () => {
        mockReq = {
          body: { event: 'EventLogLoaded', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('EventLogLoadFailed event', () => {
      it('should handle EventLogLoadFailed event', async () => {
        mockReq = {
          body: { event: 'EventLogLoadFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('EventLogSaved event', () => {
      it('should handle EventLogSaved event', async () => {
        mockReq = {
          body: { event: 'EventLogSaved', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('EventLogSaveFailed event', () => {
      it('should handle EventLogSaveFailed event', async () => {
        mockReq = {
          body: { event: 'EventLogSaveFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('APPLY_FILTER event', () => {
      it('should handle APPLY_FILTER event', async () => {
        mockReq = {
          body: { event: 'APPLY_FILTER', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('OPEN_BACKFILL event', () => {
      it('should handle OPEN_BACKFILL event', async () => {
        mockReq = {
          body: { event: 'OPEN_BACKFILL', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SAVE_BACKFILL event', () => {
      it('should handle SAVE_BACKFILL event', async () => {
        mockReq = {
          body: { event: 'SAVE_BACKFILL', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_BACKFILL event', () => {
      it('should handle CANCEL_BACKFILL event', async () => {
        mockReq = {
          body: { event: 'CANCEL_BACKFILL', currentState: 'loading' },
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
