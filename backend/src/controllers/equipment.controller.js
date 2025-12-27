/**
 * Equipment Controller
 * Handles CRUD operations for equipment/assets
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all equipment with optional filters
 * GET /api/equipment
 */
export const getAllEquipment = async (req, res, next) => {
    try {
        const { department, teamId, isScrapped, search } = req.query;

        const where = {};

        if (department) {
            where.department = department;
        }

        if (teamId) {
            where.teamId = teamId;
        }

        if (isScrapped !== undefined) {
            where.isScrapped = isScrapped === 'true';
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { assignedEmployee: { contains: search, mode: 'insensitive' } },
            ];
        }

        const equipment = await prisma.equipment.findMany({
            where,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        requests: {
                            where: {
                                stage: { in: ['NEW', 'IN_PROGRESS'] },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform _count to openRequestsCount
        const equipmentWithCount = equipment.map((e) => ({
            ...e,
            openRequestsCount: e._count.requests,
            _count: undefined,
        }));

        res.json({
            count: equipmentWithCount.length,
            equipment: equipmentWithCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single equipment by ID
 * GET /api/equipment/:id
 */
export const getEquipmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const equipment = await prisma.equipment.findUnique({
            where: { id },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        members: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
                requests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        technician: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        requests: {
                            where: {
                                stage: { in: ['NEW', 'IN_PROGRESS'] },
                            },
                        },
                    },
                },
            },
        });

        if (!equipment) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Equipment not found',
            });
        }

        res.json({
            equipment: {
                ...equipment,
                openRequestsCount: equipment._count.requests,
                _count: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new equipment
 * POST /api/equipment
 */
export const createEquipment = async (req, res, next) => {
    try {
        const {
            name,
            serialNumber,
            department,
            assignedEmployee,
            purchaseDate,
            warrantyEndDate,
            location,
            teamId,
        } = req.body;

        // Validate required fields
        if (!name || !serialNumber || !department || !location || !teamId || !purchaseDate) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Name, serial number, department, location, team, and purchase date are required',
            });
        }

        // Check if serial number already exists
        const existing = await prisma.equipment.findUnique({
            where: { serialNumber },
        });

        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Equipment with this serial number already exists',
            });
        }

        // Verify team exists
        const team = await prisma.maintenanceTeam.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance team not found',
            });
        }

        const equipment = await prisma.equipment.create({
            data: {
                name,
                serialNumber,
                department,
                assignedEmployee: assignedEmployee || null,
                purchaseDate: new Date(purchaseDate),
                warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
                location,
                teamId,
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Equipment created successfully',
            equipment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update equipment
 * PUT /api/equipment/:id
 */
export const updateEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            department,
            assignedEmployee,
            warrantyEndDate,
            location,
            teamId,
        } = req.body;

        // Check if equipment exists
        const existing = await prisma.equipment.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Equipment not found',
            });
        }

        // Cannot update scrapped equipment
        if (existing.isScrapped) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot update scrapped equipment',
            });
        }

        const equipment = await prisma.equipment.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(department && { department }),
                ...(assignedEmployee !== undefined && { assignedEmployee }),
                ...(warrantyEndDate !== undefined && {
                    warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null
                }),
                ...(location && { location }),
                ...(teamId && { teamId }),
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            message: 'Equipment updated successfully',
            equipment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete equipment
 * DELETE /api/equipment/:id
 */
export const deleteEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if equipment exists
        const existing = await prisma.equipment.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { requests: true },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Equipment not found',
            });
        }

        // Don't delete if has maintenance requests
        if (existing._count.requests > 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot delete equipment with maintenance history. Consider marking as scrapped instead.',
            });
        }

        await prisma.equipment.delete({
            where: { id },
        });

        res.json({
            message: 'Equipment deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get distinct departments
 * GET /api/equipment/departments
 */
export const getDepartments = async (req, res, next) => {
    try {
        const departments = await prisma.equipment.findMany({
            select: { department: true },
            distinct: ['department'],
        });

        res.json({
            departments: departments.map((d) => d.department),
        });
    } catch (error) {
        next(error);
    }
};
