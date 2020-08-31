const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');

function ResetPasswordMiddleware() {
  return async (req, res, next) => {
    try {
      const resetToken = req.headers['password_reset'];
      const userDetails = jwt.verify(resetToken, process.env.SECRET_KEY);
      const user = (await User.getUserById(userDetails.id)).Items[0];
      if (!user || !userDetails.resetPassword) throw new Error('Access denied');
      req.user = user;
      console.log('User Details', userDetails);
      next();
    } catch (error) {
      console.log('Error occured in reset password middleware', error.message);
      res.status(401).send({ error: error.message });
    }
  }
}

module.exports = {
  ResetPasswordMiddleware
};
