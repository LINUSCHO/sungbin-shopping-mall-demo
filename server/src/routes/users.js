const express = require('express');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

// Create
router.post('/', createUser);

// Read all with basic pagination
router.get('/', getUsers);

// Read one
router.get('/:id', getUserById);

// Update
router.put('/:id', updateUser);

// Delete
router.delete('/:id', deleteUser);

module.exports = router;


