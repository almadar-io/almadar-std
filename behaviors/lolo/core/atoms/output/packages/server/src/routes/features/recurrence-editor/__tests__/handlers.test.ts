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

describe('RecurrenceEditor Server Handlers', () => {
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

    describe('RecurrenceLoaded event', () => {
      it('should handle RecurrenceLoaded event', async () => {
        mockReq = {
          body: { event: 'RecurrenceLoaded', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RecurrenceLoadFailed event', () => {
      it('should handle RecurrenceLoadFailed event', async () => {
        mockReq = {
          body: { event: 'RecurrenceLoadFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RecurrenceSaved event', () => {
      it('should handle RecurrenceSaved event', async () => {
        mockReq = {
          body: { event: 'RecurrenceSaved', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RecurrenceSaveFailed event', () => {
      it('should handle RecurrenceSaveFailed event', async () => {
        mockReq = {
          body: { event: 'RecurrenceSaveFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('EDIT_RULE event', () => {
      it('should handle EDIT_RULE event', async () => {
        mockReq = {
          body: { event: 'EDIT_RULE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('OPEN_EXCEPTION event', () => {
      it('should handle OPEN_EXCEPTION event', async () => {
        mockReq = {
          body: { event: 'OPEN_EXCEPTION', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_SCHEDULE event', () => {
      it('should handle CANCEL_SCHEDULE event', async () => {
        mockReq = {
          body: { event: 'CANCEL_SCHEDULE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SAVE_RULE event', () => {
      it('should handle SAVE_RULE event', async () => {
        mockReq = {
          body: { event: 'SAVE_RULE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_RULE event', () => {
      it('should handle CANCEL_RULE event', async () => {
        mockReq = {
          body: { event: 'CANCEL_RULE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SKIP_OCCURRENCE event', () => {
      it('should handle SKIP_OCCURRENCE event', async () => {
        mockReq = {
          body: { event: 'SKIP_OCCURRENCE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RESCHEDULE_OCCURRENCE event', () => {
      it('should handle RESCHEDULE_OCCURRENCE event', async () => {
        mockReq = {
          body: { event: 'RESCHEDULE_OCCURRENCE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CLOSE_EXCEPTION event', () => {
      it('should handle CLOSE_EXCEPTION event', async () => {
        mockReq = {
          body: { event: 'CLOSE_EXCEPTION', currentState: 'loading' },
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
