const { User } = require('../models/User');
const Vote = require('../models/Vote');

const createUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('A user with this email already exists'), { statusCode: 409 });
  }

  const user = await User.create({ name, email, password, role: 'user' });
  user.password = undefined;
  return user;
};

const getAllUsers = async () => {
  return User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
};

const getUserById = async (id) => {
  const user = await User.findOne({ _id: id, role: 'user' }).select('-password');
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

const updateUser = async (id, updates) => {
  const user = await User.findOne({ _id: id, role: 'user' }).select('+password');

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  if (updates.name     !== undefined) user.name     = updates.name;
  if (updates.email    !== undefined) user.email    = updates.email;
  if (updates.password !== undefined) user.password = updates.password;

  await user.save();
  user.password = undefined;
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findOneAndDelete({ _id: id, role: 'user' });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  await Vote.deleteMany({ userId: id });
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
