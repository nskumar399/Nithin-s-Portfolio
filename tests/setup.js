// Test environment setup
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Connect mongoose to the in-memory database
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  // Clear all collections
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop MongoDB instance
  if (mongod) {
    await mongod.stop();
  }
});

// Global test helpers
global.testHelpers = {
  // Helper to create test user
  createTestUser: async () => {
    const User = require('../models/User');
    return await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    });
  },
  
  // Helper to create test project
  createTestProject: async (owner) => {
    const Project = require('../models/Project');
    return await Project.create({
      name: 'Test Project',
      description: 'Test project description',
      category: 'mechanical',
      owner: owner._id
    });
  },
  
  // Helper to generate JWT token
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');
    return jwt.sign(user.getAuthTokenData(), config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE
    });
  }
};