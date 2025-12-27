/**
 * User Controller
 * Handles user management operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all users
 * GET /api/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { role, teamId } = req.query;

        const where = {};

        if (role) {
            where.role = role;
        }

        if (teamId) {
            where.teamId = teamId;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                teamId: true,
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            count: users.length,
            users,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get technicians (for assignment dropdowns)
 * GET /api/users/technicians
 */
export const getTechnicians = async (req, res, next) => {
    try {
        const { teamId } = req.query;

        const where = {
            role: 'TECHNICIAN',
        };

        if (teamId) {
            where.teamId = teamId;
        }

        const technicians = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            count: technicians.length,
            technicians,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                teamId: true,
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
                _count: {
                    select: {
                        assignedRequests: true,
                        createdRequests: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user role (Manager only)
 * PATCH /api/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, teamId } = req.body;

        // Validate role
        if (!['USER', 'TECHNICIAN', 'MANAGER'].includes(role)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid role',
            });
        }

        // Check user exists
        const existing = await prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
        }

        // Cannot change own role
        if (id === req.user.id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot change your own role',
            });
        }

        // If changing to TECHNICIAN, teamId is required
        if (role === 'TECHNICIAN' && !teamId && !existing.teamId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Team ID is required for technicians',
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                role,
                teamId: role === 'TECHNICIAN' ? (teamId || existing.teamId) : null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                teamId: true,
                team: true,
            },
        });

        res.json({
            message: 'User role updated successfully',
            user,
        });
    } catch (error) {
        next(error);
    }
};
