/**
 * Event Routes Registration
 *
 * Main routes file - registers all trait event routes.
 * All data operations flow through trait event handlers with guard enforcement.
 *
 * @packageDocumentation
 */

import type { Express } from 'express';
import { authenticateFirebase } from '@almadar/server';
import { registerEventListeners } from './eventListeners.js';
import wizardFormRouter from './routes/features/wizard-form/routes.js';

/**
 * Register all trait event routes and server-side event listeners.
 *
 * All API routes are protected by Firebase Auth middleware.
 * Cross-trait event listeners are wired via the server event bus.
 */
export function registerRoutes(app: Express): void {
  // Apply auth middleware to all API routes
  app.use('/api', authenticateFirebase);

  app.use('/api/wizard-form', wizardFormRouter);

  // Phase 7: Register server-side cross-trait event listeners
  registerEventListeners();
}
