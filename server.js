const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');

// Import configuration and services
const config = require('./config/config');
const database = require('./config/database');
const logger = require('./services/logger');
const websocketService = require('./services/websocketService');

// Import middleware
const { securityHeaders, compressionMiddleware, generalRateLimit } = require('./middlewares/security');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const apiRoutes = require('./routes');

// Import documentation
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./docs/swagger');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = config.PORT;
  }

  async initialize() {
    try {
      // Connect to database
      await database.connect();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Initialize WebSocket
      websocketService.initialize(this.server);
      
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security headers
    this.app.use(securityHeaders);
    
    // Compression
    this.app.use(compressionMiddleware);
    
    // CORS
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
    }));
    
    // Request logging
    this.app.use(morgan('combined', { stream: logger.stream }));
    
    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));
    
    // Rate limiting
    this.app.use(generalRateLimit);
    
    // Request ID for tracing
    this.app.use((req, res, next) => {
      req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      res.set('X-Request-ID', req.id);
      next();
    });
    
    // Request timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          requestId: req.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });

    logger.info('Middleware setup complete');
  }

  setupRoutes() {
    // Health check route (before rate limiting)
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: '1.0.0',
        services: {
          database: database.isConnected() ? 'connected' : 'disconnected',
          websocket: websocketService.getStats(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100 + ' MB'
          }
        }
      });
    });

    // API Documentation
    this.app.use('/api/docs', swaggerUi.serve);
    this.app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
    
    // Swagger JSON
    this.app.get('/api/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // API Routes
    this.app.use('/api', apiRoutes);
    
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to CAD Design Backend API',
        version: '1.0.0',
        documentation: `${req.protocol}://${req.get('host')}/api/docs`,
        health: `${req.protocol}://${req.get('host')}/health`,
        endpoints: {
          api: '/api',
          auth: '/api/auth',
          projects: '/api/projects',
          files: '/api/files',
          documentation: '/api/docs',
          health: '/health'
        }
      });
    });

    logger.info('Routes setup complete');
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
    
    // Unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Close server & exit process
      this.gracefulShutdown('Unhandled Promise Rejection');
    });
    
    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      this.gracefulShutdown('Uncaught Exception');
    });
    
    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });
    
    // Graceful shutdown on SIGINT
    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('Error handling setup complete');
  }

  async gracefulShutdown(signal) {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    this.server.close(async (err) => {
      if (err) {
        logger.error('Error during server close:', err);
        process.exit(1);
      }
      
      try {
        // Close database connection
        await database.disconnect();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
      logger.info(`❤️  Health Check: http://localhost:${this.port}/health`);
      
      if (config.NODE_ENV === 'development') {
        logger.info('🔧 Development mode: Detailed logging enabled');
      }
    });

    this.server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof this.port === 'string' 
        ? 'Pipe ' + this.port 
        : 'Port ' + this.port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return this.server;
  }
}

// Create and start server
const server = new Server();

async function startServer() {
  try {
    await server.initialize();
    server.start();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = server;