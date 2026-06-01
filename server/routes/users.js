// server/routes/users.js
const express = require('express');
const router = express.Router();
const { createUser, getUser, updateUser, deleteUser, listUsers } = require('../controllers/userController');
const { auth } = require('../middlewares/auth');
const { roleCheck } = require('../middlewares/roleCheck');

// All routes require authentication and admin role
router.use(auth, roleCheck(['admin']));

router.post('/', createUser);          // Create new user (admin only)
router.get('/', listUsers);            // List all users
router.get('/:id', getUser);           // Get user by id
router.put('/:id', updateUser);        // Update user
router.delete('/:id', deleteUser);     // Delete user

module.exports = router;
