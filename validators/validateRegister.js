// Express Validator
const { body } = require('express-validator');
// const { User } = require('../models/user.model');

const registerValidationChain = () => {
return [
  body('email').not().isEmpty().withMessage('E-mail is required').isEmail().withMessage('E-mail is invalid'),
  body('password', 'Password is required').not().isEmpty(),
  // body().custom(async (req) => {
  //   const email = req.email;
  //   // Retrieving a user with request email
  //   const user = await User.getUserByEmail(email);
  //   if (user) throw new Error('Email already exists');
  // })
  ];
} 

module.exports = {
    registerValidationChain
};
