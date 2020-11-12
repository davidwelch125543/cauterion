const express = require('express');
const router = express.Router();
const  validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { loginValidationChain } = require('../validators/validateLogin');
const adminController = require('../controllers/adminController');
const operatorController = require('../controllers/operatorController');
const roles = require('../helpers/auth.roles');
const { USER_TYPES } = require('../models/user.model');

const AdminRolesMiddleware = AuthorizerMiddleware(roles.ADMIN_PANEL);
const OnlyAdminRoleAuth = AuthorizerMiddleware([USER_TYPES.ADMIN]);

router.post('/login', loginValidationChain(roles.ADMIN_PANEL), validateMiddleware, adminController.adminLogin);

// Support Tickets
router.post('/tickets', AdminRolesMiddleware, adminController.getTickets);
router.get('/tickets/:id', AdminRolesMiddleware, adminController.getTicketById);
router.put('/tickets/:id', AdminRolesMiddleware, adminController.updateSupportTicket);

// Only admin control users
router.post('/users', OnlyAdminRoleAuth, adminController.getUsersList);
router.get('/users/:id', OnlyAdminRoleAuth, adminController.getUserInfo);

// Operators
router.post('/operators', OnlyAdminRoleAuth, operatorController.createOperator);
router.get('/operators', OnlyAdminRoleAuth, operatorController.getOperatorsList);
router.delete('/operators/:id', OnlyAdminRoleAuth, operatorController.deleteOperator);

module.exports = router;
