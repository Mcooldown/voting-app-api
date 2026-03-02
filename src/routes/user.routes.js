const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { createUserValidation, updateUserValidation } = require('../validators/user.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');


router.use(authenticate, requireAdmin);
router.post('/', createUserValidation, validate, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', updateUserValidation, validate, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
