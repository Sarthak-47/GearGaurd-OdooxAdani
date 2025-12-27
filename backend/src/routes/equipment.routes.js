/**
 * Equipment Routes
 */

import { Router } from 'express';
import {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getDepartments,
} from '../controllers/equipment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get distinct departments (for filters)
router.get('/departments', getDepartments);

// CRUD operations
router.get('/', getAllEquipment);
router.get('/:id', getEquipmentById);
router.post('/', authorize('MANAGER'), createEquipment);
router.put('/:id', authorize('MANAGER'), updateEquipment);
router.delete('/:id', authorize('MANAGER'), deleteEquipment);

export default router;
