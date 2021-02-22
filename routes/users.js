const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const usersController = require('../controllers/usersController');
const testsController = require('../controllers/testsController');
const { USER_TYPES } = require('../models/user.model');
const { uploader } = require('../helpers/multer');

const UserAuthorizerMiddleware = AuthorizerMiddleware();
const UserOpAuth = AuthorizerMiddleware([USER_TYPES.USER, USER_TYPES.OPERATOR]);

// Tests
router.get('/tests', UserAuthorizerMiddleware, testsController.getUserTests);
router.post('/tests/scan', UserAuthorizerMiddleware, testsController.scanTest);
router.put('/tests/:id', UserAuthorizerMiddleware, testsController.updateTest);

// Tickets
router.post('/tickets', UserAuthorizerMiddleware, usersController.getUserTickets);
router.get('/tickets/:id', UserAuthorizerMiddleware, usersController.getTicketById);
router.put('/tickets/:id', UserAuthorizerMiddleware, usersController.updateOwnTicket);
router.post('/support-ticket', AuthorizerMiddleware(), usersController.createSupportTicket);
router.post('/health-info', AuthorizerMiddleware(), uploader().array('healthInfoImages'), usersController.createHealthInfoTicket);

// QR INFO
router.get('/package/check', AuthorizerMiddleware([USER_TYPES.USER, USER_TYPES.OPERATOR, USER_TYPES.ADMIN]), usersController.checkPackageValidity);
router.get('/qr/:qrUserId', UserAuthorizerMiddleware, usersController.getUserInfoFromQR);

router.get('/notifications', UserOpAuth, usersController.getNotificationsInfo);
router.get('/notifications/seen/:ticketId', UserOpAuth, usersController.updateNotifications);

module.exports = router;
