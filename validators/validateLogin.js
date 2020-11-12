// Express Validator
const { body } = require('express-validator');
const validator = require('validator');
const { User } = require('../models/user.model');
const bcrypt = require('bcryptjs');

// User type => 'admin', 'user', 'operator'... etc.
const loginValidationChain = (adminRoles) => {
  return [
  body('password', 'Password is required').not().isEmpty(),
  body().custom(async (req) => {
		const login = req.login;
		const pass = req.password;
		const isEmail = validator.isEmail(login);
		const isPhoneNumber = validator.isMobilePhone(login, 'any');

		let userFound = null;
		if (!isEmail && !isPhoneNumber) throw new Error('Provide email or phone number');
		
		if (isEmail) {
			userFound = await User.getUserByEmail(login);
			req.email = login;
		} else if(isPhoneNumber) {
			userFound = await User.getUserByPhoneNumber(login);
			req.phone = login;
		}

		// Check admin login Validation
		if (adminRoles && userFound && !adminRoles.includes(userFound.type)) throw new Error('Access denined');
		if (!userFound || !userFound.active) {
			throw new Error('A user with such email doesn\'t exist or is not active');
		}
		const passwordMatch = await bcrypt.compare(pass, userFound.password);
		if (!passwordMatch) throw new Error('Wrong password');
		req.user = userFound;
  })
];
}

module.exports = {
  loginValidationChain,
};
