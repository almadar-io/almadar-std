/**
 * RatingReviewSubmit Event Routes
 *
 * Express router for trait event handling.
 * All operations go through POST /events endpoint.
 *
 * @packageDocumentation
 */

import { Router, type IRouter } from 'express';
import { handleEvent } from './handlers.js';

const router: IRouter = Router();

// All events go through this single endpoint
router.post('/events', handleEvent);

export default router;
