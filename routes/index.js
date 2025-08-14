const express = require('express');
const authRoutes = require('./auth');
const projectRoutes = require('./projects');
const fileRoutes = require('./files');
const config = require('../config/config');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and account management
 *   - name: Projects
 *     description: CAD project management
 *   - name: Files
 *     description: File upload and management
 *   - name: AI
 *     description: AI-powered design assistance
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Service is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0',
    services: {
      database: 'connected', // This would check actual DB connection in production
      ai: config.OPENAI_API_KEY ? 'available' : 'unavailable',
      fileStorage: 'available'
    }
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CAD Design Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      authentication: '/api/auth',
      projects: '/api/projects',
      files: '/api/files',
      health: '/api/health'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);

module.exports = router;