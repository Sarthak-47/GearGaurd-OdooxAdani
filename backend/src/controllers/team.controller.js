/**
 * Maintenance Team Controller
 * Handles CRUD operations for maintenance teams
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all maintenance teams
 * GET /api/teams
 */
export const getAllTeams = async (req, res, next) => {
    try {
        const teams = await prisma.maintenanceTeam.findMany({
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        equipment: true,
                        requests: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            count: teams.length,
            teams,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single team by ID
 * GET /api/teams/:id
 */
export const getTeamById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const team = await prisma.maintenanceTeam.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        serialNumber: true,
                        department: true,
                        isScrapped: true,
                    },
                },
                requests: {
                    where: {
                        stage: { in: ['NEW', 'IN_PROGRESS'] },
                    },
                    select: {
                        id: true,
                        subject: true,
                        stage: true,
                        type: true,
                        priority: true,
                    },
                },
            },
        });

        if (!team) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance team not found',
            });
        }

        res.json({ team });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new maintenance team
 * POST /api/teams
 */
export const createTeam = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Team name is required',
            });
        }

        // Check if team name already exists
        const existing = await prisma.maintenanceTeam.findUnique({
            where: { name },
        });

        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Team with this name already exists',
            });
        }

        const team = await prisma.maintenanceTeam.create({
            data: { name },
            include: {
                members: true,
            },
        });

        res.status(201).json({
            message: 'Team created successfully',
            team,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update team
 * PUT /api/teams/:id
 */
export const updateTeam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Team name is required',
            });
        }

        // Check if team exists
        const existing = await prisma.maintenanceTeam.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance team not found',
            });
        }

        // Check if new name conflicts with another team
        const nameConflict = await prisma.maintenanceTeam.findFirst({
            where: {
                name,
                id: { not: id },
            },
        });

        if (nameConflict) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Another team with this name already exists',
            });
        }

        const team = await prisma.maintenanceTeam.update({
            where: { id },
            data: { name },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            message: 'Team updated successfully',
            team,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete team
 * DELETE /api/teams/:id
 */
export const deleteTeam = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if team exists and has dependencies
        const team = await prisma.maintenanceTeam.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        members: true,
                        equipment: true,
                        requests: true,
                    },
                },
            },
        });

        if (!team) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance team not found',
            });
        }

        // Don't delete teams with dependencies
        if (team._count.members > 0 || team._count.equipment > 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot delete team with members or assigned equipment',
            });
        }

        await prisma.maintenanceTeam.delete({
            where: { id },
        });

        res.json({
            message: 'Team deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add member to team
 * POST /api/teams/:id/members
 */
export const addTeamMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'User ID is required',
            });
        }

        // Check if team exists
        const team = await prisma.maintenanceTeam.findUnique({
            where: { id },
        });

        if (!team) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance team not found',
            });
        }

        // Check if user exists and is a technician
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
            });
        }

        if (user.role !== 'TECHNICIAN') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Only technicians can be added to maintenance teams',
            });
        }

        // Update user's team
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { teamId: id },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
            },
        });

        res.json({
            message: 'Member added to team successfully',
            member: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
export const removeTeamMember = async (req, res, next) => {
    try {
        const { id, userId } = req.params;

        // Check if user is in this team
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                teamId: id,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found in this team',
            });
        }

        // Remove user from team
        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });

        res.json({
            message: 'Member removed from team successfully',
        });
    } catch (error) {
        next(error);
    }
};
