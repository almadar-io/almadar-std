import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useWizardFormLogic } from '@/hooks/traits/useWizardFormLogic';
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

describe('useWizardFormLogic', () => {
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
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });
      expect(result.current.state).toBe('loading');
    });

    it('should auto-dispatch INIT on mount', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      renderHook(() => useWizardFormLogic(), { wrapper });
      await waitFor(() => {
        expect(mockSendEvent).toHaveBeenCalledWith('INIT', undefined, 'loading');
      });
    });
  });

  describe('event dispatch', () => {
    it('should dispatch INIT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('INIT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch WizardLoaded event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('WizardLoaded', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('WizardLoaded', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch WizardLoadFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('WizardLoadFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('WizardLoadFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch WizardSaved event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('WizardSaved', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('WizardSaved', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch WizardSaveFailed event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('WizardSaveFailed', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('WizardSaveFailed', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch ADVANCE event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('ADVANCE', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('ADVANCE', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RETREAT event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('RETREAT', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('RETREAT', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch CANCEL event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('CANCEL', { test: 'payload' });
      });

      expect(mockSendEvent).toHaveBeenCalledWith('CANCEL', { test: 'payload' }, expect.any(String));
    });

    it('should dispatch RESTART event to server', async () => {
      mockSendEvent.mockResolvedValue({ success: true, newState: 'loading', data: {} });
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

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
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

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
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.error).toBe('Access denied');
    });

    it('should handle network errors', async () => {
      mockSendEvent.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

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
      const { result } = renderHook(() => useWizardFormLogic(), { wrapper });

      await act(async () => {
        await result.current.dispatch('INIT');
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
