import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useRecurrenceEditorLogic } from '@/hooks/traits/useRecurrenceEditorLogic';
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

describe('useRecurrenceEditorLogic', () => {
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
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useRecurrenceEditorLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RecurrenceLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RecurrenceLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RecurrenceLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RecurrenceLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RecurrenceLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RecurrenceLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RecurrenceSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RecurrenceSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RecurrenceSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RecurrenceSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RecurrenceSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RecurrenceSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch EDIT_RULE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('EDIT_RULE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('EDIT_RULE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch OPEN_EXCEPTION event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('OPEN_EXCEPTION', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('OPEN_EXCEPTION', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_SCHEDULE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_SCHEDULE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_SCHEDULE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SAVE_RULE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SAVE_RULE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SAVE_RULE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_RULE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_RULE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_RULE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SKIP_OCCURRENCE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SKIP_OCCURRENCE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SKIP_OCCURRENCE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RESCHEDULE_OCCURRENCE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RESCHEDULE_OCCURRENCE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RESCHEDULE_OCCURRENCE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CLOSE_EXCEPTION event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CLOSE_EXCEPTION', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CLOSE_EXCEPTION', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RESTART event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

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
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

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
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

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
      const { result } = renderHook(() => useRecurrenceEditorLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
