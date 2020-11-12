const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');

function AuthorizerMiddleware(userRoles) {
  return async (req, res, next) => {
    let defaultErrorMessage = 'Authorization failed';
    try {
      const bearerToken = req.headers['authorization'];
      const token = bearerToken.split(' ')[1];
      const userDetails = jwt.verify(token, process.env.SECRET_KEY);
      const user = (await User.getUserById(userDetails.id)).Items[0];
      if (!user) throw new Error(defaultErrorMessage);
      if (userRoles && !userRoles.includes(user.type)) {
        defaultErrorMessage = 'Access denied';
        throw new Error(defaultErrorMessage);
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).send(defaultErrorMessage);
    }
  } 
}

module.exports = {
  AuthorizerMiddleware
};
