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
const WEAK_PASSWORDS = {
  noUppercase: 'password1!',
  noNumber:    'Password!!',
  noSymbol:    'Password1',
  tooShort:    'Pa1!',
};

const adminPayload = { name: 'Admin',  email: 'admin@test.com', password: STRONG_PASSWORD, role: 'admin' };
const userPayload  = { name: 'Voter',  email: 'voter@test.com', password: STRONG_PASSWORD, role: 'user' };

const getAdminToken = async () => {
  await User.create(adminPayload);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: adminPayload.email, password: adminPayload.password });
  return res.body.data.token;
};

const getUserToken = async () => {
  await User.create(userPayload);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userPayload.email, password: userPayload.password });
  return res.body.data.token;
};

describe('POST /api/users', () => {
  describe('when authenticated as admin', () => {
    it('should create a user with role forced to "user"', async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Doe', email: 'john@test.com', password: STRONG_PASSWORD });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('role', 'user');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should force role to "user" even when "admin" role is passed in body', async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sneaky', email: 'sneaky@test.com', password: STRONG_PASSWORD, role: 'admin' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user).toHaveProperty('role', 'user');
    });

    it('should return 409 when email already exists', async () => {
      const token = await getAdminToken();
      await User.create(userPayload);
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userPayload);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 when name is missing', async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'x@x.com', password: STRONG_PASSWORD });
      expect(res.statusCode).toBe(422);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'name' })])
      );
    });

    it('should return 422 when email is invalid', async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', email: 'bad-email', password: STRONG_PASSWORD });
      expect(res.statusCode).toBe(422);
    });

    describe('password strength validation', () => {
      it('should return 422 when password has no uppercase letter', async () => {
        const token = await getAdminToken();
        const res = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'T', email: 't@t.com', password: WEAK_PASSWORDS.noUppercase });
        expect(res.statusCode).toBe(422);
      });

      it('should return 422 when password has no number', async () => {
        const token = await getAdminToken();
        const res = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'T', email: 't@t.com', password: WEAK_PASSWORDS.noNumber });
        expect(res.statusCode).toBe(422);
      });

      it('should return 422 when password has no symbol', async () => {
        const token = await getAdminToken();
        const res = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'T', email: 't@t.com', password: WEAK_PASSWORDS.noSymbol });
        expect(res.statusCode).toBe(422);
      });

      it('should return 422 when password is shorter than 8 characters', async () => {
        const token = await getAdminToken();
        const res = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'T', email: 't@t.com', password: WEAK_PASSWORDS.tooShort });
        expect(res.statusCode).toBe(422);
      });
    });
  });

  describe('when not authenticated or insufficient role', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@test.com', password: STRONG_PASSWORD });
      expect(res.statusCode).toBe(401);
    });

    it('should return 403 when authenticated as a regular user', async () => {
      const token = await getUserToken();
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John', email: 'john@test.com', password: STRONG_PASSWORD });
      expect(res.statusCode).toBe(403);
    });
  });
});

describe('GET /api/users', () => {
  it('should return 200 with a list of users for admin', async () => {
    const token = await getAdminToken();
    await User.create(userPayload);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    res.body.data.users.forEach((u) => expect(u).not.toHaveProperty('password'));
  });

  it('should not include admin accounts in the list', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    res.body.data.users.forEach((u) => expect(u.role).toBe('user'));
  });

  it('should return 403 when a regular user accesses the list', async () => {
    const token = await getUserToken();
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  it('should return 200 with the user for admin', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user._id).toBe(userId);
  });

  it('should return 404 when the target user is an admin', async () => {
    const token = await getAdminToken();
    const admin = await User.findOne({ email: adminPayload.email });

    const res = await request(app)
      .get(`/api/users/${admin._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for a non-existent id', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/users/64f000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/users/:id', () => {
  it('should update the user name successfully', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
  });

  it('should return 422 when trying to update email', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'newemail@test.com' });

    expect(res.statusCode).toBe(422);
  });

  it('should return 422 when trying to update role', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });

    expect(res.statusCode).toBe(422);
  });

  it('should return 422 when trying to update password', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewPass1!' });

    expect(res.statusCode).toBe(422);
  });

  it('should return 422 when name is invalid (too short)', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });

    expect(res.statusCode).toBe(422);
  });

  it('should return 422 when no allowed fields are provided', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(422);
  });

  it('should return 404 for a non-existent user', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .put('/api/users/64f000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when the target user is an admin', async () => {
    const token = await getAdminToken();
    const admin = await User.findOne({ email: adminPayload.email });

    const res = await request(app)
      .put(`/api/users/${admin._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  it('should delete a user and return 200', async () => {
    const token = await getAdminToken();
    const created = await User.create(userPayload);
    const userId = created._id.toString();

    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm deletion
    const getRes = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('should return 404 for a non-existent user', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .delete('/api/users/64f000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 when the target user is an admin', async () => {
    const token = await getAdminToken();
    const admin = await User.findOne({ email: adminPayload.email });

    const res = await request(app)
      .delete(`/api/users/${admin._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 403 when a regular user attempts deletion', async () => {
    const token = await getUserToken();
    const target = await User.create({ name: 'Target', email: 'target@x.com', password: STRONG_PASSWORD, role: 'user' });

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});
