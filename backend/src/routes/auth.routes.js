/**
 * Authentication Routes
 */

import { Router } from 'express';
import {
    register,
    login,
    getMe,
    updateProfile
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);

export default router;
