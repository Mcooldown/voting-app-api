const userService = require('../services/user.service');

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await userService.createUser({ name, email, password, role });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({
      success: true,
      data: { count: users.length, users },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
