const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cad_design_db',
  DB_NAME: process.env.DB_NAME || 'cad_design_db',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-development',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'dwg,dxf,step,stp,iges,igs,stl,obj').split(','),
  UPLOAD_PATH: path.join(__dirname, '../uploads'),
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // Security Configuration
  BCRYPT_ROUNDS: 12,
  
  // Validation Rules
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  PROJECT_NAME_MIN_LENGTH: 2,
  
  // WebSocket Configuration
  WEBSOCKET_ORIGINS: (process.env.WEBSOCKET_ORIGINS || 'http://localhost:3000').split(',')
};