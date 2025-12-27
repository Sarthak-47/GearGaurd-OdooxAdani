/**
 * GearGuard - Express Server Entry Point
 * Main application setup with middleware and routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import equipmentRoutes from './routes/equipment.routes.js';
import teamRoutes from './routes/team.routes.js';
import requestRoutes from './routes/request.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'GearGuard API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong',
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🔧 GearGuard API Server                         ║
║   Running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
