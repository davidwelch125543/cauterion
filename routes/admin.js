const express = require('express');
const router = express.Router();
const  validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { loginValidationChain } = require('../validators/validateLogin');
const adminController = require('../controllers/adminController');

const AdminMiddleware = AuthorizerMiddleware('admin');

router.post('/login', loginValidationChain('admin'), validateMiddleware, adminController.loginAsAdmin);

// Support Tickets
router.post('/tickets', AdminMiddleware, adminController.getTickets);
router.get('/tickets/:id', AdminMiddleware, adminController.getTicketById);
router.put('/tickets/:id', AdminMiddleware, adminController.updateSupportTicket);
router.post('/users', AdminMiddleware, adminController.getUsersList);
router.get('/users/:id', AdminMiddleware, adminController.getUserInfo);

module.exports = router;
