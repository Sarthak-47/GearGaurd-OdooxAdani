/**
 * Maintenance Team Routes
 */

import { Router } from 'express';
import {
    getAllTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
} from '../controllers/team.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read operations - all authenticated users
router.get('/', getAllTeams);
router.get('/:id', getTeamById);

// Write operations - managers only
router.post('/', authorize('MANAGER'), createTeam);
router.put('/:id', authorize('MANAGER'), updateTeam);
router.delete('/:id', authorize('MANAGER'), deleteTeam);

// Team member management - managers only
router.post('/:id/members', authorize('MANAGER'), addTeamMember);
router.delete('/:id/members/:userId', authorize('MANAGER'), removeTeamMember);

export default router;
