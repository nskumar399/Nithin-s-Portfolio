const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const config = require('../config/config');
const logger = require('./logger');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socket IDs
    this.projectRooms = new Map();   // projectId -> Set of user IDs
  }

  initialize(server) {
    const socketIo = require('socket.io');
    
    this.io = socketIo(server, {
      cors: {
        origin: config.WEBSOCKET_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-refreshTokens');
        
        if (!user || !user.isActive) {
          return next(new Error('Invalid token or user not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.setupEventHandlers();
    
    logger.info('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      // Project collaboration events
      socket.on('join-project', (data) => this.handleJoinProject(socket, data));
      socket.on('leave-project', (data) => this.handleLeaveProject(socket, data));
      socket.on('project-update', (data) => this.handleProjectUpdate(socket, data));
      socket.on('file-upload-progress', (data) => this.handleFileUploadProgress(socket, data));
      socket.on('cursor-position', (data) => this.handleCursorPosition(socket, data));
      socket.on('design-comment', (data) => this.handleDesignComment(socket, data));
      
      // Real-time notifications
      socket.on('typing-start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing-stop', (data) => this.handleTypingStop(socket, data));
      
      // Disconnect handler
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Track connected users
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);

    logger.info(`User connected via WebSocket: ${socket.user.username} (${socket.id})`);

    // Send connection success
    socket.emit('connected', {
      message: 'Connected successfully',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    // Notify about user's online status
    this.broadcastUserStatus(userId, 'online');
  }

  async handleJoinProject(socket, data) {
    try {
      const { projectId } = data;
      const userId = socket.userId;

      // Verify user has access to project
      const project = await Project.findOne({
        _id: projectId,
        isDeleted: false
      });

      if (!project) {
        socket.emit('error', { message: 'Project not found' });
        return;
      }

      if (!project.hasAccess(userId)) {
        socket.emit('error', { message: 'Access denied to project' });
        return;
      }

      // Join project room
      socket.join(`project-${projectId}`);
      
      // Track project rooms
      if (!this.projectRooms.has(projectId)) {
        this.projectRooms.set(projectId, new Set());
      }
      this.projectRooms.get(projectId).add(userId);

      // Notify other users in the project
      socket.to(`project-${projectId}`).emit('user-joined-project', {
        userId,
        username: socket.user.username,
        projectId,
        timestamp: new Date().toISOString()
      });

      // Send current project participants to the new user
      const participants = Array.from(this.projectRooms.get(projectId));
      socket.emit('project-participants', {
        projectId,
        participants,
        timestamp: new Date().toISOString()
      });

      logger.info(`User ${socket.user.username} joined project ${projectId}`);
    } catch (error) {
      logger.error('Error joining project:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  }

  handleLeaveProject(socket, data) {
    const { projectId } = data;
    const userId = socket.userId;

    socket.leave(`project-${projectId}`);
    
    // Remove from project room tracking
    if (this.projectRooms.has(projectId)) {
      this.projectRooms.get(projectId).delete(userId);
      
      if (this.projectRooms.get(projectId).size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    // Notify other users
    socket.to(`project-${projectId}`).emit('user-left-project', {
      userId,
      username: socket.user.username,
      projectId,
      timestamp: new Date().toISOString()
    });

    logger.info(`User ${socket.user.username} left project ${projectId}`);
  }

  handleProjectUpdate(socket, data) {
    const { projectId, updateType, updateData } = data;
    
    // Broadcast update to all users in the project
    socket.to(`project-${projectId}`).emit('project-updated', {
      projectId,
      updateType,
      updateData,
      updatedBy: {
        id: socket.userId,
        username: socket.user.username
      },
      timestamp: new Date().toISOString()
    });
  }

  handleFileUploadProgress(socket, data) {
    const { projectId, fileName, progress } = data;
    
    // Broadcast upload progress to project members
    socket.to(`project-${projectId}`).emit('file-upload-progress', {
      projectId,
      fileName,
      progress,
      uploadedBy: {
        id: socket.userId,
        username: socket.user.username
      },
      timestamp: new Date().toISOString()
    });
  }

  handleCursorPosition(socket, data) {
    const { projectId, position, viewId } = data;
    
    // Broadcast cursor position to other users
    socket.to(`project-${projectId}`).emit('cursor-position', {
      projectId,
      viewId,
      position,
      user: {
        id: socket.userId,
        username: socket.user.username
      },
      timestamp: new Date().toISOString()
    });
  }

  handleDesignComment(socket, data) {
    const { projectId, comment, position } = data;
    
    // Broadcast new comment to project members
    socket.to(`project-${projectId}`).emit('new-design-comment', {
      projectId,
      comment,
      position,
      author: {
        id: socket.userId,
        username: socket.user.username,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      },
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStart(socket, data) {
    const { projectId } = data;
    
    socket.to(`project-${projectId}`).emit('user-typing', {
      projectId,
      user: {
        id: socket.userId,
        username: socket.user.username
      },
      isTyping: true,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { projectId } = data;
    
    socket.to(`project-${projectId}`).emit('user-typing', {
      projectId,
      user: {
        id: socket.userId,
        username: socket.user.username
      },
      isTyping: false,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(socket) {
    const userId = socket.userId;
    
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      
      // If user has no more connections, they're offline
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
        this.broadcastUserStatus(userId, 'offline');
      }
    }

    // Remove from all project rooms
    for (const [projectId, users] of this.projectRooms) {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(`project-${projectId}`).emit('user-left-project', {
          userId,
          username: socket.user?.username,
          projectId,
          timestamp: new Date().toISOString()
        });
        
        if (users.size === 0) {
          this.projectRooms.delete(projectId);
        }
      }
    }

    logger.info(`User disconnected: ${socket.user?.username || 'unknown'} (${socket.id})`);
  }

  // Broadcast user online/offline status
  broadcastUserStatus(userId, status) {
    this.io.emit('user-status-changed', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (this.connectedUsers.has(userId)) {
      const socketIds = this.connectedUsers.get(userId);
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Broadcast to all users in a project
  broadcastToProject(projectId, event, data) {
    this.io.to(`project-${projectId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: Array.from(this.connectedUsers.values())
        .reduce((sum, sockets) => sum + sockets.size, 0),
      uniqueUsers: this.connectedUsers.size,
      activeProjects: this.projectRooms.size,
      projectParticipants: Array.from(this.projectRooms.values())
        .reduce((sum, users) => sum + users.size, 0)
    };
  }
}

module.exports = new WebSocketService();