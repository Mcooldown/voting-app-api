const request = require('supertest');
const app = require('../src/app');
const { connect, closeDatabase, clearDatabase } = require('./helpers/db.helper');
const { User } = require('../src/models/User');
const Candidate = require('../src/models/Candidate');
const Vote = require('../src/models/Vote');

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

const adminPayload = { name: 'Admin', email: 'admin@vote.com', password: STRONG_PASSWORD, role: 'admin' };
const voterPayload = { name: 'Voter', email: 'voter@vote.com', password: STRONG_PASSWORD, role: 'user' };

const loginAs = async (payload) => {
  await User.create(payload);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });
  return { token: res.body.data.token, userId: res.body.data.user._id };
};

describe('GET /api/votes/candidates', () => {
  it('should return 200 with an empty array when no candidates exist', async () => {
    const { token } = await loginAs(voterPayload);
    const res = await request(app)
      .get('/api/votes/candidates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.candidates)).toBe(true);
    expect(res.body.data.count).toBe(0);
  });

  it('should return candidates WITHOUT voteCount', async () => {
    await Candidate.create([{ name: 'Alice' }, { name: 'Bob' }]);
    const { token } = await loginAs(voterPayload);

    const res = await request(app)
      .get('/api/votes/candidates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    res.body.data.candidates.forEach((c) => {
      expect(c).not.toHaveProperty('voteCount');
      expect(c).toHaveProperty('name');
    });
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/votes/candidates');
    expect(res.statusCode).toBe(401);
  });

  it('should be accessible to admin as well', async () => {
    const { token } = await loginAs(adminPayload);
    const res = await request(app)
      .get('/api/votes/candidates')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/votes', () => {
  describe('when voting for an existing candidate', () => {
    it('should succeed and return the candidate (without voteCount)', async () => {
      await Candidate.create({ name: 'Alice' });
      const { token } = await loginAs(voterPayload);

      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'Alice' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidate.name).toBe('Alice');
      expect(res.body.data.candidate).not.toHaveProperty('voteCount');
    });
  });

  describe('when voting for a new name (free text)', () => {
    it('should create the candidate and return it', async () => {
      const { token } = await loginAs(voterPayload);

      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'Brand New Person' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.candidate.name).toBe('Brand New Person');
    });
  });

  describe('when voting is not allowed', () => {
    it('should return 409 when a user tries to vote a second time', async () => {
      const { token } = await loginAs(voterPayload);

      await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'Alice' });

      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'Bob' });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/already cast/i);
    });

    it('should return 403 when an admin tries to vote', async () => {
      const { token } = await loginAs(adminPayload);
      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'Alice' });
      expect(res.statusCode).toBe(403);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).post('/api/votes').send({ candidate_name: 'Alice' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('when request body is invalid', () => {
    it('should return 422 when candidate_name is missing', async () => {
      const { token } = await loginAs(voterPayload);
      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(422);
    });

    it('should return 422 when candidate_name is too short', async () => {
      const { token } = await loginAs(voterPayload);
      const res = await request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidate_name: 'A' });
      expect(res.statusCode).toBe(422);
    });
  });
});

describe('GET /api/votes/results', () => {
  it('should return 200 with total votes and per-candidate counts for admin', async () => {
    // Seed candidates and votes directly
    const [alice, bob] = await Candidate.create([{ name: 'Alice' }, { name: 'Bob' }]);
    const [u1, u2, u3] = await User.create([
      { name: 'V1', email: 'v1@x.com', password: STRONG_PASSWORD, role: 'user' },
      { name: 'V2', email: 'v2@x.com', password: STRONG_PASSWORD, role: 'user' },
      { name: 'V3', email: 'v3@x.com', password: STRONG_PASSWORD, role: 'user' },
    ]);
    await Vote.create([
      { userId: u1._id, candidateId: alice._id },
      { userId: u2._id, candidateId: alice._id },
      { userId: u3._id, candidateId: bob._id },
    ]);

    const { token } = await loginAs(adminPayload);
    const res = await request(app)
      .get('/api/votes/results')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.candidates[0].name).toBe('Alice');
    expect(res.body.data.candidates[0].voteCount).toBe(2);
    expect(res.body.data.candidates[1].name).toBe('Bob');
    expect(res.body.data.candidates[1].voteCount).toBe(1);
  });

  it('should return total of 0 when no votes have been cast', async () => {
    const { token } = await loginAs(adminPayload);
    const res = await request(app)
      .get('/api/votes/results')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.candidates).toHaveLength(0);
  });

  it('should return 403 when a regular user requests results', async () => {
    const { token } = await loginAs(voterPayload);
    const res = await request(app)
      .get('/api/votes/results')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/votes/results');
    expect(res.statusCode).toBe(401);
  });
});

describe('Cascade delete: user deletion removes their vote', () => {
  it('should remove the vote when the voter is deleted', async () => {
    const adminToken = (await loginAs(adminPayload)).token;
    const alice = await Candidate.create({ name: 'Alice' });
    const voter = await User.create({ name: 'ToDelete', email: 'del@x.com', password: STRONG_PASSWORD, role: 'user' });
    await Vote.create({ userId: voter._id, candidateId: alice._id });

    // Confirm vote exists
    expect(await Vote.findOne({ userId: voter._id })).not.toBeNull();

    // Delete the user via the API
    await request(app)
      .delete(`/api/users/${voter._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Vote should be removed
    const remainingVote = await Vote.findOne({ userId: voter._id });
    expect(remainingVote).toBeNull();
  });

  it('should reflect accurate counts in results after voter deletion', async () => {
    const adminToken = (await loginAs(adminPayload)).token;
    const alice = await Candidate.create({ name: 'Alice' });
    const [v1, v2] = await User.create([
      { name: 'V1', email: 'v1@x.com', password: STRONG_PASSWORD, role: 'user' },
      { name: 'V2', email: 'v2@x.com', password: STRONG_PASSWORD, role: 'user' },
    ]);
    await Vote.create([
      { userId: v1._id, candidateId: alice._id },
      { userId: v2._id, candidateId: alice._id },
    ]);

    // Before deletion: total = 2
    let res = await request(app)
      .get('/api/votes/results')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data.total).toBe(2);

    // Delete one voter
    await request(app)
      .delete(`/api/users/${v1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // After deletion: total = 1
    res = await request(app)
      .get('/api/votes/results')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.candidates[0].voteCount).toBe(1);
  });
});
