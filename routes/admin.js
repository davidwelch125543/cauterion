const express = require('express');
const router = express.Router();
const  validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { loginValidationChain } = require('../validators/validateLogin');
const adminController = require('../controllers/adminController');

router.post('/login', loginValidationChain('admin'), validateMiddleware, adminController.loginAsAdmin);
router.post('/tickets', AuthorizerMiddleware('admin'), adminController.getTickets);

module.exports = router;
