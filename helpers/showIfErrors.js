const validationResult = require('express-validator').validationResult;

module.exports = (req, res, next) => {
  // Getting validation result from express-validator
  let singleError;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    singleError = errors.array()[0];
    res.status(400).send(singleError);
  } else {
    next();
  }
};
