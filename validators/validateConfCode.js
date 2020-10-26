// Express Validator
const { body, } = require('express-validator');
const { User } = require('../models/user.model');
const validator = require('validator').default;

const confirmValidationChain = () => {
return [
  body('code').not().isEmpty().withMessage('Empty code'),
  body().custom(async (req) => {
		const login = req.login;
		const isEmail = validator.isEmail(login);
		const isPhoneNumber = validator.isMobilePhone(login, 'any');

		if (!isEmail && !isPhoneNumber) throw new Error('Provide email or phone number');
		let user = null;
		if (isEmail) {
			user = await User.getUserByEmail(login);
			req.email = login;
		} else if(isPhoneNumber) {
			user = await User.getUserByPhoneNumber(login);
			req.phone = login;
		}
		req.user = user;
  })];
}

module.exports = {
  confirmValidationChain
};
