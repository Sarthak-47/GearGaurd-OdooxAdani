/**
 * User Routes
 */

import { Router } from 'express';
import {
    getAllUsers,
    getTechnicians,
    getUserById,
    updateUserRole,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get technicians (for assignment dropdowns)
router.get('/technicians', getTechnicians);

// User management
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/role', authorize('MANAGER'), updateUserRole);

export default router;
