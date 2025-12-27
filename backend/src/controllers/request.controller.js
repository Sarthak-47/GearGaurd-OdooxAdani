/**
 * Maintenance Request Controller
 * Handles CRUD operations and business logic for maintenance requests
 * 
 * Business Logic:
 * - Corrective (Breakdown): User creates → Technician assigns → Logs duration → Repaired
 * - Preventive: Manager creates with scheduled date → Appears in calendar → Technician completes
 * - Scrap: Moving to SCRAP marks equipment as isScrapped = true
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all maintenance requests with optional filters
 * GET /api/requests
 */
export const getAllRequests = async (req, res, next) => {
    try {
        const {
            type,
            stage,
            teamId,
            equipmentId,
            technicianId,
            priority,
            scheduledFrom,
            scheduledTo,
            overdue
        } = req.query;

        const where = {};

        // Filter by type (CORRECTIVE or PREVENTIVE)
        if (type) {
            where.type = type;
        }

        // Filter by stage
        if (stage) {
            where.stage = stage;
        }

        // Filter by team
        if (teamId) {
            where.teamId = teamId;
        }

        // Filter by equipment
        if (equipmentId) {
            where.equipmentId = equipmentId;
        }

        // Filter by assigned technician
        if (technicianId) {
            where.technicianId = technicianId;
        }

        // Filter by priority
        if (priority) {
            where.priority = parseInt(priority);
        }

        // Filter by scheduled date range (for calendar view)
        if (scheduledFrom || scheduledTo) {
            where.scheduledDate = {};
            if (scheduledFrom) {
                where.scheduledDate.gte = new Date(scheduledFrom);
            }
            if (scheduledTo) {
                where.scheduledDate.lte = new Date(scheduledTo);
            }
        }

        // Filter overdue requests (NEW or IN_PROGRESS with createdAt > 2 days ago)
        if (overdue === 'true') {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            where.stage = { in: ['NEW', 'IN_PROGRESS'] };
            where.createdAt = { lt: twoDaysAgo };
        }

        // Role-based filtering
        if (req.user.role === 'TECHNICIAN' && req.user.teamId) {
            // Technicians can only see their team's requests
            where.teamId = req.user.teamId;
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        serialNumber: true,
                        department: true,
                        location: true,
                        isScrapped: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Add overdue flag to each request
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const requestsWithOverdue = requests.map((r) => ({
            ...r,
            isOverdue:
                (r.stage === 'NEW' || r.stage === 'IN_PROGRESS') &&
                new Date(r.createdAt) < twoDaysAgo,
        }));

        res.json({
            count: requestsWithOverdue.length,
            requests: requestsWithOverdue,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get requests grouped by stage (for Kanban board)
 * GET /api/requests/kanban
 */
export const getKanbanRequests = async (req, res, next) => {
    try {
        const where = {};

        // Role-based filtering
        if (req.user.role === 'TECHNICIAN' && req.user.teamId) {
            where.teamId = req.user.teamId;
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        serialNumber: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Calculate overdue
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Group by stage
        const kanban = {
            NEW: [],
            IN_PROGRESS: [],
            REPAIRED: [],
            SCRAP: [],
        };

        requests.forEach((r) => {
            const requestWithOverdue = {
                ...r,
                isOverdue:
                    (r.stage === 'NEW' || r.stage === 'IN_PROGRESS') &&
                    new Date(r.createdAt) < twoDaysAgo,
            };
            kanban[r.stage].push(requestWithOverdue);
        });

        res.json({ kanban });
    } catch (error) {
        next(error);
    }
};

/**
 * Get calendar events (Preventive maintenance only)
 * GET /api/requests/calendar
 */
export const getCalendarRequests = async (req, res, next) => {
    try {
        const { start, end } = req.query;

        const where = {
            type: 'PREVENTIVE',
            scheduledDate: { not: null },
        };

        if (start) {
            where.scheduledDate = { ...where.scheduledDate, gte: new Date(start) };
        }
        if (end) {
            where.scheduledDate = { ...where.scheduledDate, lte: new Date(end) };
        }

        // Role-based filtering
        if (req.user.role === 'TECHNICIAN' && req.user.teamId) {
            where.teamId = req.user.teamId;
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        // Transform to calendar events
        const events = requests.map((r) => ({
            id: r.id,
            title: r.subject,
            start: r.scheduledDate,
            end: r.scheduledDate, // Same day event
            allDay: true,
            extendedProps: {
                stage: r.stage,
                equipment: r.equipment,
                technician: r.technician,
                priority: r.priority,
            },
            backgroundColor: getStageColor(r.stage),
            borderColor: getStageColor(r.stage),
        }));

        res.json({ events });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single request by ID
 * GET /api/requests/:id
 */
export const getRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await prisma.maintenanceRequest.findUnique({
            where: { id },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        serialNumber: true,
                        department: true,
                        location: true,
                        isScrapped: true,
                        team: true,
                    },
                },
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
                technician: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!request) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        res.json({ request });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new maintenance request
 * POST /api/requests
 * 
 * Business Logic:
 * - Auto-fills maintenance team from selected equipment
 * - Preventive type requires Manager role and scheduled date
 */
export const createRequest = async (req, res, next) => {
    try {
        const {
            subject,
            description,
            type,
            priority,
            equipmentId,
            scheduledDate,
            technicianId,
        } = req.body;

        // Validate required fields
        if (!subject || !type || !equipmentId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Subject, type, and equipment are required',
            });
        }

        // Validate type
        if (!['CORRECTIVE', 'PREVENTIVE'].includes(type)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Type must be CORRECTIVE or PREVENTIVE',
            });
        }

        // Only Managers can create Preventive requests
        if (type === 'PREVENTIVE' && req.user.role !== 'MANAGER') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only managers can create preventive maintenance requests',
            });
        }

        // Preventive requires scheduled date
        if (type === 'PREVENTIVE' && !scheduledDate) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Preventive maintenance requires a scheduled date',
            });
        }

        // Get equipment and auto-fill team
        const equipment = await prisma.equipment.findUnique({
            where: { id: equipmentId },
            include: { team: true },
        });

        if (!equipment) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Equipment not found',
            });
        }

        // Cannot create request for scrapped equipment
        if (equipment.isScrapped) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot create maintenance request for scrapped equipment',
            });
        }

        // Validate technician belongs to the team
        if (technicianId) {
            const technician = await prisma.user.findFirst({
                where: {
                    id: technicianId,
                    teamId: equipment.teamId,
                    role: 'TECHNICIAN',
                },
            });

            if (!technician) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Technician must be a member of the equipment\'s maintenance team',
                });
            }
        }

        const request = await prisma.maintenanceRequest.create({
            data: {
                subject,
                description: description || null,
                type,
                priority: priority || 1,
                equipmentId,
                teamId: equipment.teamId, // Auto-filled from equipment
                createdById: req.user.id,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                technicianId: technicianId || null,
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        serialNumber: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Maintenance request created successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update request stage (Kanban drag & drop)
 * PATCH /api/requests/:id/stage
 * 
 * Business Logic:
 * - SCRAP: Marks equipment as isScrapped = true
 */
export const updateRequestStage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;

        // Validate stage
        if (!['NEW', 'IN_PROGRESS', 'REPAIRED', 'SCRAP'].includes(stage)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid stage',
            });
        }

        // Get existing request
        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id },
            include: { equipment: true },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        // Role-based permission check
        if (req.user.role === 'USER') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Users cannot change request stage',
            });
        }

        // Technicians can only change their team's requests
        if (req.user.role === 'TECHNICIAN' && req.user.teamId !== existing.teamId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only update your team\'s requests',
            });
        }

        // Business Logic: Moving to SCRAP
        if (stage === 'SCRAP') {
            // Mark equipment as scrapped
            await prisma.equipment.update({
                where: { id: existing.equipmentId },
                data: { isScrapped: true },
            });
        }

        // Update request stage
        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                stage,
                notes: stage === 'SCRAP'
                    ? `${existing.notes || ''}\n[${new Date().toISOString()}] Equipment marked as scrapped by ${req.user.name}`.trim()
                    : existing.notes,
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        isScrapped: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            message: `Request stage updated to ${stage}`,
            request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign technician to request
 * PATCH /api/requests/:id/assign
 */
export const assignTechnician = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { technicianId } = req.body;

        // Get existing request
        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        // Self-assignment for technicians
        if (req.user.role === 'TECHNICIAN') {
            // Technicians can only assign themselves
            if (technicianId && technicianId !== req.user.id) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Technicians can only assign themselves to requests',
                });
            }

            // Must be in the same team
            if (req.user.teamId !== existing.teamId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only assign yourself to your team\'s requests',
                });
            }
        }

        // Validate technician belongs to the team
        if (technicianId) {
            const technician = await prisma.user.findFirst({
                where: {
                    id: technicianId,
                    teamId: existing.teamId,
                    role: 'TECHNICIAN',
                },
            });

            if (!technician) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Technician must be a member of the assigned maintenance team',
                });
            }
        }

        // Update request
        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                technicianId: technicianId || null,
                // Auto-set to IN_PROGRESS when technician assigned
                stage: technicianId && existing.stage === 'NEW' ? 'IN_PROGRESS' : existing.stage,
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            message: technicianId ? 'Technician assigned successfully' : 'Technician unassigned',
            request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Complete request and log duration
 * PATCH /api/requests/:id/complete
 */
export const completeRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { duration, notes } = req.body;

        // Get existing request
        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        // Only assigned technician or manager can complete
        if (req.user.role === 'TECHNICIAN') {
            if (existing.technicianId !== req.user.id) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only the assigned technician can complete this request',
                });
            }
        }

        if (req.user.role === 'USER') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Users cannot complete requests',
            });
        }

        // Update request
        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                stage: 'REPAIRED',
                duration: duration ? parseFloat(duration) : existing.duration,
                notes: notes
                    ? `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}`.trim()
                    : existing.notes,
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            message: 'Request completed successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update request details
 * PUT /api/requests/:id
 */
export const updateRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { subject, description, priority, scheduledDate } = req.body;

        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        // Cannot update completed or scrapped requests
        if (['REPAIRED', 'SCRAP'].includes(existing.stage)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Cannot update completed or scrapped requests',
            });
        }

        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                ...(subject && { subject }),
                ...(description !== undefined && { description }),
                ...(priority && { priority }),
                ...(scheduledDate !== undefined && {
                    scheduledDate: scheduledDate ? new Date(scheduledDate) : null
                }),
            },
            include: {
                equipment: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                technician: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        res.json({
            message: 'Request updated successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete request
 * DELETE /api/requests/:id
 */
export const deleteRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Maintenance request not found',
            });
        }

        // Only managers can delete, and only NEW requests
        if (req.user.role !== 'MANAGER') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only managers can delete requests',
            });
        }

        if (existing.stage !== 'NEW') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Can only delete requests in NEW stage',
            });
        }

        await prisma.maintenanceRequest.delete({
            where: { id },
        });

        res.json({
            message: 'Request deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get request statistics
 * GET /api/requests/stats
 */
export const getRequestStats = async (req, res, next) => {
    try {
        const where = {};

        // Role-based filtering
        if (req.user.role === 'TECHNICIAN' && req.user.teamId) {
            where.teamId = req.user.teamId;
        }

        // Count by stage
        const byStage = await prisma.maintenanceRequest.groupBy({
            by: ['stage'],
            where,
            _count: true,
        });

        // Count by type
        const byType = await prisma.maintenanceRequest.groupBy({
            by: ['type'],
            where,
            _count: true,
        });

        // Count by team
        const byTeam = await prisma.maintenanceRequest.groupBy({
            by: ['teamId'],
            where,
            _count: true,
        });

        // Get team names
        const teams = await prisma.maintenanceTeam.findMany({
            select: { id: true, name: true },
        });

        const byTeamWithNames = byTeam.map((t) => ({
            team: teams.find((tm) => tm.id === t.teamId)?.name || 'Unknown',
            count: t._count,
        }));

        // Overdue count
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const overdueCount = await prisma.maintenanceRequest.count({
            where: {
                ...where,
                stage: { in: ['NEW', 'IN_PROGRESS'] },
                createdAt: { lt: twoDaysAgo },
            },
        });

        res.json({
            stats: {
                byStage: byStage.reduce((acc, s) => ({ ...acc, [s.stage]: s._count }), {}),
                byType: byType.reduce((acc, t) => ({ ...acc, [t.type]: t._count }), {}),
                byTeam: byTeamWithNames,
                overdue: overdueCount,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Helper function for calendar colors
function getStageColor(stage) {
    const colors = {
        NEW: '#3B82F6',      // Blue
        IN_PROGRESS: '#F59E0B', // Amber
        REPAIRED: '#10B981',   // Green
        SCRAP: '#EF4444',      // Red
    };
    return colors[stage] || '#6B7280';
}
