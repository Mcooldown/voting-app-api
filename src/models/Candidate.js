const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Candidate name must be at least 2 characters'],
      maxlength: [150, 'Candidate name must be at most 150 characters'],
    },
  },
  { timestamps: true }
);

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
