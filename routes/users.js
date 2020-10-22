const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const usersController = require('../controllers/usersController');
const testsController = require('../controllers/testsController');
const UserAuthorizerMiddleware = AuthorizerMiddleware();

// Tests
router.get('/tests', UserAuthorizerMiddleware, testsController.getUserTests);
router.post('/tests/scan', UserAuthorizerMiddleware, testsController.scanTest);
router.put('/tests/:id', UserAuthorizerMiddleware, testsController.updateTest);

// Tickets
router.post('/tickets', UserAuthorizerMiddleware, usersController.getUserTickets);
router.get('/tickets/:id', UserAuthorizerMiddleware, usersController.getTicketById);
router.put('/tickets/:id', UserAuthorizerMiddleware, usersController.updateOwnTicket);
router.post('/support-ticket', AuthorizerMiddleware(), usersController.createSupportTicket);

// QR INFO
router.get('/qr/:qrUserId', UserAuthorizerMiddleware, usersController.getUserInfoFromQR);

module.exports = router;
