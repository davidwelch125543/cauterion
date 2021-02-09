const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const membersController = require('../controllers/membersController');
const { USER_TYPES } = require('../models/user.model');
const UserAuthorizerMiddleware = AuthorizerMiddleware();
const User_OperAuthorizerMiddleware = AuthorizerMiddleware([USER_TYPES.USER, USER_TYPES.OPERATOR]);

// Family accounts
router.post('/', UserAuthorizerMiddleware, membersController.createFamilyAccount);
router.get('/', UserAuthorizerMiddleware, membersController.getMembersList);
router.get('/:memberId', UserAuthorizerMiddleware, membersController.getMemberById);
router.put('/:memberId', User_OperAuthorizerMiddleware, membersController.updateMember);
router.post('/account-request', UserAuthorizerMiddleware, membersController.requestForStandaloneAccount);

module.exports = router;
