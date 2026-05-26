import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useEventLogTimelineLogic } from '@/hooks/traits/useEventLogTimelineLogic';
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

describe('useEventLogTimelineLogic', () => {
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
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useEventLogTimelineLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch EventLogLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('EventLogLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('EventLogLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch EventLogLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('EventLogLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('EventLogLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch EventLogSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('EventLogSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('EventLogSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch EventLogSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('EventLogSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('EventLogSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch APPLY_FILTER event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('APPLY_FILTER', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('APPLY_FILTER', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch OPEN_BACKFILL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('OPEN_BACKFILL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('OPEN_BACKFILL', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SAVE_BACKFILL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SAVE_BACKFILL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SAVE_BACKFILL', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_BACKFILL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_BACKFILL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_BACKFILL', { test: 'payload' }, expect.any(String));
    });

  });

  describe('loading state', () => {
    it('should set loading=true when dispatching', async () => {
      let resolvePromise: (value: unknown) => void;
      mockSendEvent.mockImplementation(() => new Promise(resolve => { resolvePromise = resolve; }));
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

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
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

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
      const { result } = renderHook(() => useEventLogTimelineLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
