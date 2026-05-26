import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useBoardItemBoardLogic } from '@/hooks/traits/useBoardItemBoardLogic';
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

describe('useBoardItemBoardLogic', () => {
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
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useBoardItemBoardLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch BoardItemsLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('BoardItemsLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('BoardItemsLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch BoardItemsLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('BoardItemsLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('BoardItemsLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch BoardItemsSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('BoardItemsSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('BoardItemsSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch OPEN_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('OPEN_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('OPEN_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ADD_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ADD_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ADD_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch MOVE_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('MOVE_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('MOVE_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch REORDER_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('REORDER_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('REORDER_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch REORDER_POSITION event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('REORDER_POSITION', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('REORDER_POSITION', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch BoardItemsSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('BoardItemsSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('BoardItemsSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CLOSE_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CLOSE_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CLOSE_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch DELETE_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('DELETE_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('DELETE_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SAVE_CARD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SAVE_CARD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SAVE_CARD', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_ADD event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_ADD', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_ADD', { test: 'payload' }, expect.any(String));
    });

  });

  describe('loading state', () => {
    it('should set loading=true when dispatching', async () => {
      let resolvePromise: (value: unknown) => void;
      mockSendEvent.mockImplementation(() => new Promise(resolve => { resolvePromise = resolve; }));
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

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
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

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
      const { result } = renderHook(() => useBoardItemBoardLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
