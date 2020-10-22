const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const membersController = require('../controllers/membersController');
const UserAuthorizerMiddleware = AuthorizerMiddleware();

// Family accounts
router.post('/', UserAuthorizerMiddleware, membersController.createFamilyAccount);
router.get('/', UserAuthorizerMiddleware, membersController.getMembersList);
router.get('/:memberId', UserAuthorizerMiddleware, membersController.getMemberById);

module.exports = router;