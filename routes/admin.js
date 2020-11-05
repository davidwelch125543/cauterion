const express = require('express');
const router = express.Router();
const  validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { loginValidationChain } = require('../validators/validateLogin');
const adminController = require('../controllers/adminController');
const operatorController = require('../controllers/operatorController');

const AdminMiddleware = AuthorizerMiddleware('admin');
const OperatorMiddleware = AuthorizerMiddleware('operator');

router.post('/login', loginValidationChain('admin'), validateMiddleware, adminController.loginAsAdmin);

// Support Tickets
router.post('/tickets', AdminMiddleware, adminController.getTickets);
router.get('/tickets/:id', AdminMiddleware, adminController.getTicketById);
router.put('/tickets/:id', AdminMiddleware, adminController.updateSupportTicket);
router.post('/users', AdminMiddleware, adminController.getUsersList);
router.get('/users/:id', AdminMiddleware, adminController.getUserInfo);

// Operators
router.post('/operators', AdminMiddleware, operatorController.createOperator);
router.get('/operators', AdminMiddleware, operatorController.getOperatorsList);

module.exports = router;
