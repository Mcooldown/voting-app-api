const express = require('express');
const router = express.Router();
const voteController = require('../controllers/vote.controller');
const { castVoteValidation } = require('../validators/vote.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireUser } = require('../middleware/roles');

router.get('/candidates', authenticate, voteController.getCandidates);
router.post('/', authenticate, requireUser, castVoteValidation, validate, voteController.castVote);
router.get('/results', authenticate, requireAdmin, voteController.getResults);

module.exports = router;
