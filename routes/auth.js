const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { ResetPasswordMiddleware } = require('../middlewares/resetPasswordValidator');
const { registerValidationChain } = require('../validators/validateRegister');
const { loginValidationChain } = require('../validators/validateLogin');

router.post('/register', registerValidationChain(), validateMiddleware, authController.register);
router.post('/check-confirmation-code', authController.checkConfirmationCode);
router.post('/login', loginValidationChain(), validateMiddleware, authController.login);
router.get('/logout', authController.logout);
router.get('/get-profile', AuthorizerMiddleware(), authController.getProfile);
router.put('/update-profile', AuthorizerMiddleware(), authController.updateProfile);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/validate-reset-code', authController.validatePasswordResetCode);
router.post('/change-password', ResetPasswordMiddleware(), authController.changeForgottenPassword);

// Google authentication
router.post('/google', authController.googleSignIn);

// Facebook authentication
// router.post('/facebook', passport.authenticate('facebookToken', { session: false }), authController.facebookOAuth);

module.exports = router;

