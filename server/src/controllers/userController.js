const User = require('../models/User');
const bcrypt = require('bcrypt');

// Create
async function createUser(req, res) {
  try {
    const { email, name, password, user_type, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, password: hashedPassword, user_type, address });
    const { password: _pw, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: 'Failed to create user', error: error.message });
  }
}

// Read all
async function getUsers(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.status(200).json({ items, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
}

// Read one
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch user', error: error.message });
  }
}

// Update
async function updateUser(req, res) {
  try {
    const { email, name, password, user_type, address } = req.body;
    const update = { email, name, user_type, address };
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password: _pw, ...safe } = user.toObject();
    res.status(200).json(safe);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: 'Failed to update user', error: error.message });
  }
}

// Delete
async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete user', error: error.message });
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};


