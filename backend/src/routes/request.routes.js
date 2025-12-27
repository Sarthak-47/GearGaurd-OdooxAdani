/**
 * Maintenance Request Routes
 */

import { Router } from 'express';
import {
    getAllRequests,
    getKanbanRequests,
    getCalendarRequests,
    getRequestById,
    createRequest,
    updateRequest,
    updateRequestStage,
    assignTechnician,
    completeRequest,
    deleteRequest,
    getRequestStats,
} from '../controllers/request.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Special views
router.get('/kanban', getKanbanRequests);
router.get('/calendar', getCalendarRequests);
router.get('/stats', getRequestStats);

// CRUD operations
router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.put('/:id', updateRequest);
router.delete('/:id', deleteRequest);

// Stage and assignment operations
router.patch('/:id/stage', updateRequestStage);
router.patch('/:id/assign', assignTechnician);
router.patch('/:id/complete', completeRequest);

export default router;
