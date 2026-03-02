const { body } = require('express-validator');

const castVoteValidation = [
  body('candidate_name')
    .trim()
    .notEmpty()
    .withMessage('Candidate name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Candidate name must be between 2 and 150 characters'),
];

module.exports = { castVoteValidation };
