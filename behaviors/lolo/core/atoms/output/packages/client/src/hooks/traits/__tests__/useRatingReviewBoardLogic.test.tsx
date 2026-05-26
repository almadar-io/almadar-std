import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useRatingReviewBoardLogic } from '@/hooks/traits/useRatingReviewBoardLogic';
import { useOrbitalBridge } from '@/hooks/useOrbitalBridge';

// Mock the orbital bridge
vi.mock('@/hooks/useOrbitalBridge', () => ({
  useOrbitalBridge: vi.fn(),
}));

vi.mock('@almadar/ui/hooks', () => ({
  useEventBus: () => ({ emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() }),
  useUIEvents: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useRatingReviewBoardLogic', () => {
  const mockSendEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useOrbitalBridge as ReturnType<typeof vi.fn>).mockReturnValue({
      sendEvent: mockSendEvent,
      eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    });
  });

  describe('initial state', () => {
    it('should start in initial state', () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useRatingReviewBoardLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ReviewsLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ReviewsLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ReviewsLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ReviewsLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ReviewsLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ReviewsLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ReviewSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ReviewSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ReviewSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ReviewSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ReviewSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ReviewSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch WRITE_REVIEW event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('WRITE_REVIEW', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('WRITE_REVIEW', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CHANGE_SORT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CHANGE_SORT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CHANGE_SORT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch MARK_HELPFUL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('MARK_HELPFUL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('MARK_HELPFUL', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RATE_DRAFT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RATE_DRAFT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RATE_DRAFT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SUBMIT_REVIEW event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SUBMIT_REVIEW', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SUBMIT_REVIEW', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_REVIEW event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_REVIEW', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_REVIEW', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RESTART event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RESTART', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RESTART', { test: 'payload' }, expect.any(String));
    });

  });

  describe('loading state', () => {
    it('should set loading=true when dispatching', async () => {
      let resolvePromise: (value: unknown) => void;
      mockSendEvent.mockImplementation(() => new Promise(resolve => { resolvePromise = resolve; }));
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      act(() => {
        result.current.dispatch('INIT');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true, newState: 'loading', data: {} });
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle server errors', async () => {
      mockSendEvent.mockResolvedValue({ success: false, error: 'Access denied' });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('data injection', () => {
    it('should store fetched data from server response', async () => {
      const mockData = { Task: [{ id: '1', title: 'Test' }] };
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: mockData });
      const { result } = renderHook(() => useRatingReviewBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
