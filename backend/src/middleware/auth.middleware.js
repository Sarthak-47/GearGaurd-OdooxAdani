/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
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
            },
        });

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }
        next(error);
    }
};

/**
 * Middleware to check if user has required role
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is a technician in a specific team
 */
export const authorizeTeamMember = async (req, res, next) => {
    try {
        const { teamId } = req.params;

        if (req.user.role === 'MANAGER') {
            return next(); // Managers can access all teams
        }

        if (req.user.role === 'TECHNICIAN' && req.user.teamId === teamId) {
            return next();
        }

        return res.status(403).json({
            error: 'Forbidden',
            message: 'You can only access your own team\'s resources'
        });
    } catch (error) {
        next(error);
    }
};
