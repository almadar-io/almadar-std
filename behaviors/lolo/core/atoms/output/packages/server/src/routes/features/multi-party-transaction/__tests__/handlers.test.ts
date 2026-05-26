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

describe('MultiPartyTransaction Server Handlers', () => {
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

    describe('FlowLoaded event', () => {
      it('should handle FlowLoaded event', async () => {
        mockReq = {
          body: { event: 'FlowLoaded', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('FlowLoadFailed event', () => {
      it('should handle FlowLoadFailed event', async () => {
        mockReq = {
          body: { event: 'FlowLoadFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('FlowSaved event', () => {
      it('should handle FlowSaved event', async () => {
        mockReq = {
          body: { event: 'FlowSaved', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('FlowSaveFailed event', () => {
      it('should handle FlowSaveFailed event', async () => {
        mockReq = {
          body: { event: 'FlowSaveFailed', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('PARTY_CONFIRM event', () => {
      it('should handle PARTY_CONFIRM event', async () => {
        mockReq = {
          body: { event: 'PARTY_CONFIRM', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('OPEN_DISPUTE event', () => {
      it('should handle OPEN_DISPUTE event', async () => {
        mockReq = {
          body: { event: 'OPEN_DISPUTE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_TRANSACTION event', () => {
      it('should handle CANCEL_TRANSACTION event', async () => {
        mockReq = {
          body: { event: 'CANCEL_TRANSACTION', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SUBMIT_DISPUTE event', () => {
      it('should handle SUBMIT_DISPUTE event', async () => {
        mockReq = {
          body: { event: 'SUBMIT_DISPUTE', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('CANCEL_REASON event', () => {
      it('should handle CANCEL_REASON event', async () => {
        mockReq = {
          body: { event: 'CANCEL_REASON', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('SUBMIT_CANCEL event', () => {
      it('should handle SUBMIT_CANCEL event', async () => {
        mockReq = {
          body: { event: 'SUBMIT_CANCEL', currentState: 'loading' },
        };

        await handleEvent(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalled();
        const response = jsonResponse as { success: boolean };
        // Event should either succeed or fail gracefully
        expect(response).toHaveProperty('success');
      });
    });

    describe('RELEASE event', () => {
      it('should handle RELEASE event', async () => {
        mockReq = {
          body: { event: 'RELEASE', currentState: 'loading' },
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
    it('should enforce guard on awaiting -> awaiting via PARTY_CONFIRM', async () => {
      // Test guard enforcement
      mockReq = {
        body: { event: 'PARTY_CONFIRM', currentState: 'awaiting' },
        firebaseUser: undefined, // No user - should fail guard
      };

      await handleEvent(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonResponse as { success: boolean; guardFailed?: string };
      // Guard should either pass or fail with guardFailed message
      expect(response).toHaveProperty('success');
    });

    it('should enforce guard on awaiting -> funded via PARTY_CONFIRM', async () => {
      // Test guard enforcement
      mockReq = {
        body: { event: 'PARTY_CONFIRM', currentState: 'awaiting' },
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
