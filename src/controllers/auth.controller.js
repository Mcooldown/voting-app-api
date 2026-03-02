const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = { login };
