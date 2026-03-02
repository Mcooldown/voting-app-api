const request = require('supertest');
const app = require('../src/app');
const { connect, closeDatabase, clearDatabase } = require('./helpers/db.helper');
const { User } = require('../src/models/User');

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

const STRONG_PASSWORD = 'Password1!';

const adminPayload = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: STRONG_PASSWORD,
  role: 'admin',
};

const userPayload = {
  name: 'Regular User',
  email: 'user@example.com',
  password: STRONG_PASSWORD,
  role: 'user',
};

describe('POST /api/auth/login', () => {
  describe('when credentials are valid', () => {
    it('should return 200 with a JWT token for an admin', async () => {
      await User.create(adminPayload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminPayload.email, password: adminPayload.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('role', 'admin');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 200 with a JWT token for a regular user', async () => {
      await User.create(userPayload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userPayload.email, password: userPayload.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('role', 'user');
    });
  });

  describe('when credentials are invalid', () => {
    it('should return 401 for a wrong password', async () => {
      await User.create(adminPayload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminPayload.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('should return 401 for a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: STRONG_PASSWORD });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('when request body is invalid', () => {
    it('should return 422 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: STRONG_PASSWORD });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('should return 422 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com' });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 for an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: STRONG_PASSWORD });

      expect(res.statusCode).toBe(422);
    });
  });
});
