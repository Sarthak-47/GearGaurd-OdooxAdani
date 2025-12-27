/**
 * Authentication Controller
 * Handles user registration and login
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
    try {
        const { email, password, name, role, teamId } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, and name are required',
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User with this email already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate avatar URL
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'USER',
                teamId: teamId || null,
                avatar,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                teamId: true,
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required',
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
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
                error: 'Authentication Failed',
                message: 'Invalid email or password',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
    res.json({
        user: req.user,
    });
};

/**
 * Update user profile
 * PUT /api/auth/me
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, avatar } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(avatar && { avatar }),
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
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};
