import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RatingReviewSubmitPage } from '../RatingReviewSubmitPage.js';
import { EventBusProvider } from '@almadar/ui/providers';

// Mock orbital bridge
vi.mock('@/hooks/useOrbitalBridge', () => ({
  useOrbitalBridge: () => ({
    sendEvent: vi.fn().mockResolvedValue({ success: true, newState: 'idle', data: {} }),
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventBusProvider>{ui}</EventBusProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RatingReviewSubmitPage', () => {
  it('should render without crashing', () => {
    renderWithProviders(<RatingReviewSubmitPage />);
  });

});
