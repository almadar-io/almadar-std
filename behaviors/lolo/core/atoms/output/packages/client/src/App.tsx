import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, UISlotProvider } from '@almadar/ui/context';
import { EventBusProvider, VerificationProvider } from '@almadar/ui/providers';
import { UISlotComponent, NotifyListener } from '@almadar/ui/components';
import { I18nProvider, createTranslate } from '@almadar/ui/hooks';
import localeMessages from '../../../locales/en.json';
import { AuthProvider } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import Login from './features/auth/components/Login';
const WizardPage = lazy(() => import('./features/wizardpage/WizardPage').then(m => ({ default: m.WizardPage })));

// Export queryClient for test access (to clear cache between tests)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const i18nValue = { locale: 'en', direction: 'ltr' as const, t: createTranslate(Object.fromEntries(Object.entries(localeMessages).filter(([k]) => !k.startsWith('$'))) as Record<string, string>) };

export function App() {
  return (
    <I18nProvider value={i18nValue}>
    <ThemeProvider defaultTheme="almadar" defaultMode="light">
      <QueryClientProvider client={queryClient}>
        <EventBusProvider>
          <VerificationProvider>
          <AuthProvider>
          <UISlotProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected layout routes */}
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route index element={<WizardPage />} />
                  <Route path="wizard" element={<WizardPage />} />
                </Route>

                {/* Fallback route - redirect to main page */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              {/* Portal slots for modal, drawer, and toast overlays */}
              <UISlotComponent slot="modal" portal />
              <UISlotComponent slot="drawer" portal />
              <UISlotComponent slot="toast" portal />
              <NotifyListener />
              </Suspense>
            </BrowserRouter>
          </UISlotProvider>
          </AuthProvider>
          </VerificationProvider>
        </EventBusProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
