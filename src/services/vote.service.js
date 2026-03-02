const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const { User } = require('../models/User');

const castVote = async (userId, candidateName) => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const candidate = await Candidate.findOneAndUpdate(
    { name: { $regex: new RegExp(`^${candidateName.trim()}$`, 'i') } },
    { $setOnInsert: { name: candidateName.trim() } },
    { new: true, upsert: true, runValidators: true }
  );

  try {
    await Vote.create({ userId, candidateId: candidate._id });
  } catch (err) {
    if (err.code === 11000) {
      throw Object.assign(new Error('You have already cast your vote'), { statusCode: 409 });
    }
    throw err;
  }

  return candidate;
};

const getCandidates = async () => {
  return Candidate.find().select('_id name createdAt updatedAt').sort({ name: 1 });
};

const getResults = async () => {
  const candidates = await Candidate.aggregate([
    {
      $lookup: {
        from: 'votes',
        localField: '_id',
        foreignField: 'candidateId',
        as: 'votes',
      },
    },
    {
      $addFields: { voteCount: { $size: '$votes' } },
    },
    {
      $project: { votes: 0 },
    },
    { $sort: { voteCount: -1, name: 1 } },
  ]);

  const total = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  return { total, candidates };
};

module.exports = { castVote, getCandidates, getResults };

