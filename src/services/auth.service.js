const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const signToken = (id) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) throw new Error('JWT_SECRET environment variable is not defined');

  return jwt.sign({ id }, secret, { expiresIn });
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const token = signToken(user._id.toString());

  user.password = undefined;

  return { user, token };
};

module.exports = { login, signToken };
