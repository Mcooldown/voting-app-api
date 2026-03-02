const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginValidation } = require('../validators/auth.validator');
const { validate } = require('../middleware/validate');

router.post('/login', loginValidation, validate, authController.login);

module.exports = router;
