// Basic smoke test to verify server setup
describe('Server Setup', () => {
  it('should import config without errors', () => {
    const config = require('../../config/config');
    
    expect(config.PORT).toBeDefined();
    expect(config.NODE_ENV).toBeDefined();
    expect(config.JWT_SECRET).toBeDefined();
  });

  it('should import logger without errors', () => {
    const logger = require('../../services/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('should import models without errors', () => {
    const User = require('../../models/User');
    const Project = require('../../models/Project');
    
    expect(User).toBeDefined();
    expect(Project).toBeDefined();
  });

  it('should import services without errors', () => {
    const aiService = require('../../services/aiService');
    const fileService = require('../../services/fileService');
    
    expect(aiService).toBeDefined();
    expect(fileService).toBeDefined();
  });

  it('should import controllers without errors', () => {
    const authController = require('../../controllers/authController');
    const projectController = require('../../controllers/projectController');
    const fileController = require('../../controllers/fileController');
    
    expect(authController).toBeDefined();
    expect(projectController).toBeDefined();
    expect(fileController).toBeDefined();
  });

  it('should import routes without errors', () => {
    const authRoutes = require('../../routes/auth');
    const projectRoutes = require('../../routes/projects');
    const fileRoutes = require('../../routes/files');
    const apiRoutes = require('../../routes/index');
    
    expect(authRoutes).toBeDefined();
    expect(projectRoutes).toBeDefined();
    expect(fileRoutes).toBeDefined();
    expect(apiRoutes).toBeDefined();
  });

  it('should verify environment configuration', () => {
    const config = require('../../config/config');
    
    // Check that essential configs are defined
    expect(config.PORT).toBeDefined();
    expect(config.JWT_SECRET).toBeDefined();
    expect(config.MONGODB_URI).toBeDefined();
    expect(config.ALLOWED_FILE_TYPES).toBeDefined();
    expect(Array.isArray(config.ALLOWED_FILE_TYPES)).toBe(true);
  });

  it('should verify middleware imports', () => {
    const auth = require('../../middlewares/auth');
    const security = require('../../middlewares/security');
    const errorHandler = require('../../middlewares/errorHandler');
    
    expect(auth.authenticateToken).toBeDefined();
    expect(security.validateUserRegistration).toBeDefined();
    expect(errorHandler.errorHandler).toBeDefined();
  });
});