# CAD Design Backend API

A complete, production-ready backend for an AI-powered mechanical/CAD design software MVP with comprehensive features for project management, file handling, and real-time collaboration.

## 🚀 Features

### Core Features
- **User Authentication System** - JWT-based authentication with refresh tokens
- **Project CRUD Operations** - Full project lifecycle management
- **Secure File Handling** - Upload, download, and manage CAD files
- **Real-time Collaboration** - WebSocket-based real-time features
- **AI-assisted Design Suggestions** - OpenAI GPT-4 integration for design insights
- **Comprehensive Security** - Rate limiting, validation, and security headers

### Technical Features
- **RESTful API** with comprehensive documentation
- **Role-based Access Control** - User, Admin, and Premium roles
- **File Version Management** - Track and manage project versions
- **Real-time Notifications** - WebSocket-based project updates
- **Comprehensive Testing** - Jest test suite with high coverage
- **Production-ready Logging** - Winston-based structured logging
- **API Documentation** - Swagger/OpenAPI 3.0 documentation

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **AI Integration**: OpenAI GPT-4
- **Real-time**: Socket.IO WebSockets
- **File Handling**: Multer with secure validation
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest with MongoDB Memory Server
- **Logging**: Winston
- **Security**: Helmet, rate limiting, CORS

## 📁 Project Structure

```
├── config/                 # Configuration files
│   ├── config.js           # Main configuration
│   └── database.js         # Database connection
├── controllers/            # Route controllers
│   ├── authController.js   # Authentication logic
│   ├── projectController.js # Project management
│   └── fileController.js   # File operations
├── middlewares/            # Custom middleware
│   ├── auth.js            # Authentication middleware
│   ├── security.js        # Security & validation
│   └── errorHandler.js    # Error handling
├── models/                 # Database models
│   ├── User.js            # User schema
│   └── Project.js         # Project schema
├── routes/                 # API routes
│   ├── index.js           # Main router
│   ├── auth.js            # Authentication routes
│   ├── projects.js        # Project routes
│   └── files.js           # File routes
├── services/               # Business logic services
│   ├── aiService.js       # OpenAI integration
│   ├── fileService.js     # File handling
│   ├── logger.js          # Logging service
│   └── websocketService.js # Real-time features
├── tests/                  # Test suites
│   ├── controllers/       # Controller tests
│   ├── models/           # Model tests
│   └── setup.js          # Test configuration
├── docs/                   # Documentation
│   └── swagger.js         # Swagger configuration
├── uploads/               # File storage
└── server.js              # Main application entry
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cad-design-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/cad_design_db
   
   # JWT Secrets
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
   
   # OpenAI (Optional)
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit:
- **API Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`
- **API Root**: `http://localhost:5000/api`

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Register** or **Login** to get access tokens
2. Include the token in requests: `Authorization: Bearer <token>`
3. Tokens expire after 24 hours (configurable)
4. Use refresh tokens to get new access tokens

### Example Authentication Flow

```javascript
// 1. Register
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

// 2. Login
POST /api/auth/login
{
  "identifier": "john@example.com",
  "password": "SecurePass123!"
}

// 3. Use token for authenticated requests
GET /api/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 File Upload

Supported CAD file types:
- `.dwg` - AutoCAD Drawing
- `.dxf` - Drawing Exchange Format
- `.step/.stp` - Standard for Exchange of Product Data
- `.iges/.igs` - Initial Graphics Exchange Specification
- `.stl` - STereoLithography
- `.obj` - Wavefront OBJ

Maximum file size: 50MB (configurable)

## 🤖 AI Features

With OpenAI API key configured, the system provides:

1. **Design Suggestions** - AI-powered design recommendations
2. **Optimization Analysis** - Design optimization opportunities
3. **Design Validation** - Engineering validation and safety checks
4. **Material Recommendations** - Suitable materials for designs

## 🔄 Real-time Features

WebSocket-based real-time collaboration:

- **Project Collaboration** - Multiple users working on projects
- **File Upload Progress** - Real-time upload status
- **Cursor Position Tracking** - See where others are working
- **Design Comments** - Real-time commenting system
- **User Presence** - Online/offline status
- **Typing Indicators** - See when others are typing

## 🛡 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Comprehensive request validation
- **Security Headers** - Helmet.js security middleware
- **File Type Validation** - Secure file upload handling
- **CORS Configuration** - Cross-origin request handling
- **Password Hashing** - bcrypt for secure password storage

## 📊 Monitoring & Logging

- **Structured Logging** with Winston
- **Request Tracing** with unique request IDs
- **Error Tracking** with detailed error information
- **Performance Monitoring** with request timing
- **Health Check Endpoint** for monitoring systems

## 🚀 Deployment

The application is production-ready with:

- **Environment-based Configuration**
- **Graceful Shutdown** handling
- **Database Connection Pooling**
- **Comprehensive Error Handling**
- **Security Best Practices**
- **Logging and Monitoring**

### Docker Deployment (Future Enhancement)

```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Nithin Satya Kumar**
- Email: bnskumar399@gmail.com
- LinkedIn: [Nithin Satya Kumar](https://linkedin.com/in/nithin-satya-kumar)
- Mechanical Engineering | AI & ML Enthusiast

---

## 🎯 Project Status

This is a complete, production-ready backend implementation for an AI-powered CAD design software MVP. All core features are implemented and tested, ready for integration with frontend applications and deployment to production environments.
