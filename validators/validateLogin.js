// Express Validator
const { body } = require('express-validator');
const { User } = require('../models/user.model');
const bcrypt = require('bcryptjs');

// User type => 'admin', 'user', 'operator'... etc.
const loginValidationChain = (userType) => {
  return [
  body('email').not().isEmpty().withMessage('E-mail is required').isEmail().withMessage('E-mail is invalid'),
  body('password', 'Password is required').not().isEmpty(),
  body().custom(async (req) => {
      const email = req.email;
      const pass = req.password;

      // Checking email existence & passwords match
      const userFound = await User.getUserByEmail(email);
      // Check admin login Validation
      if (userType && userFound && userFound.type !== userType) throw new Error('Access denined');
      if (!userFound || !userFound.active) {
        throw new Error('A user with such email doesn\'t exist or is not active');
      }
      const passwordMatch = await bcrypt.compare(pass, userFound.password);
      if (!passwordMatch) throw new Error('Wrong password');
  })
];
}

module.exports = {
  loginValidationChain,
};
