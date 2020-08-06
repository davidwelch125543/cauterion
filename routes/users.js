const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const usersController = require('../controllers/usersController');
const testsController = require('../controllers/testsController');

router.get('/tests', AuthorizerMiddleware(), testsController.getUserTests);
router.post('/tests/scan', AuthorizerMiddleware(), testsController.scanTest);
router.put('/tests/:id', AuthorizerMiddleware(), testsController.updateTest);
router.post('/support-ticket', AuthorizerMiddleware(), usersController.createSupportTicket);

module.exports = router;
