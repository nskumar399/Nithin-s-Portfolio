const User = require('../../models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.role).toBe('user'); // default role
      expect(savedUser.password).not.toBe(userData.password); // should be hashed
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      await user.save();

      // Password should be hashed
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        username: 'testuser3',
        // missing email, password, firstName, lastName
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'testuser4',
        email: 'invalid-email',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
    });

    it('should compare password correctly', async () => {
      const isMatch = await testUser.comparePassword('Test123!');
      expect(isMatch).toBe(true);

      const isNotMatch = await testUser.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    it('should get auth token data', () => {
      const tokenData = testUser.getAuthTokenData();
      
      expect(tokenData.id).toBe(testUser._id);
      expect(tokenData.username).toBe(testUser.username);
      expect(tokenData.email).toBe(testUser.email);
      expect(tokenData.role).toBe(testUser.role);
      expect(tokenData.password).toBeUndefined();
    });

    it('should get full name virtual', () => {
      expect(testUser.fullName).toBe(`${testUser.firstName} ${testUser.lastName}`);
    });
  });

  describe('User Statics', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
    });

    it('should find user by email', async () => {
      const foundUser = await User.findByEmailOrUsername(testUser.email);
      expect(foundUser._id.toString()).toBe(testUser._id.toString());
    });

    it('should find user by username', async () => {
      const foundUser = await User.findByEmailOrUsername(testUser.username);
      expect(foundUser._id.toString()).toBe(testUser._id.toString());
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await User.findByEmailOrUsername('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });
});