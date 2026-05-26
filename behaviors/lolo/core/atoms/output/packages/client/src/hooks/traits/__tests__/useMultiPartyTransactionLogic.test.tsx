import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useMultiPartyTransactionLogic } from '@/hooks/traits/useMultiPartyTransactionLogic';
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

describe('useMultiPartyTransactionLogic', () => {
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
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useMultiPartyTransactionLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch FlowLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('FlowLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('FlowLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch FlowLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('FlowLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('FlowLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch FlowSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('FlowSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('FlowSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch FlowSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('FlowSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('FlowSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch PARTY_CONFIRM event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('PARTY_CONFIRM', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('PARTY_CONFIRM', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch OPEN_DISPUTE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('OPEN_DISPUTE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('OPEN_DISPUTE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_TRANSACTION event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_TRANSACTION', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_TRANSACTION', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SUBMIT_DISPUTE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SUBMIT_DISPUTE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SUBMIT_DISPUTE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL_REASON event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL_REASON', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL_REASON', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch SUBMIT_CANCEL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('SUBMIT_CANCEL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('SUBMIT_CANCEL', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RELEASE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RELEASE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RELEASE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RESTART event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

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
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

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
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

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
      const { result } = renderHook(() => useMultiPartyTransactionLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
