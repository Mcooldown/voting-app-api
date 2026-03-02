const voteService = require('../services/vote.service');

const castVote = async (req, res) => {
  try {
    const { candidate_name } = req.body;
    const candidate = await voteService.castVote(req.user._id, candidate_name);

    return res.status(200).json({
      success: true,
      message: `Vote cast successfully for "${candidate.name}"`,
      data: { candidate },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const getCandidates = async (req, res) => {
  try {
    const candidates = await voteService.getCandidates();
    return res.status(200).json({
      success: true,
      data: { count: candidates.length, candidates },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getResults = async (req, res) => {
  try {
    const results = await voteService.getResults();
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { castVote, getCandidates, getResults };
