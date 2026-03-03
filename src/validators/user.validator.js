const { body } = require('express-validator');

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one symbol'),
];

const updateUserValidation = [
  body('role').not().exists().withMessage('Role cannot be changed'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be blank')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one symbol'),
  (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name && !email && !password) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'body', message: 'At least one of name, email, or password must be provided' }],
      });
    }
    next();
  },
];

module.exports = { createUserValidation, updateUserValidation };
