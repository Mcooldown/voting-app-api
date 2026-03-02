const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'candidateId is required'],
    },
  },
  { timestamps: true }
);

voteSchema.index({ userId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
