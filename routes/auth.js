const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateMiddleware = require('../helpers/showIfErrors');
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const { ResetPasswordMiddleware } = require('../middlewares/resetPasswordValidator');
const { registerValidationChain } = require('../validators/validateRegister');
const { loginValidationChain } = require('../validators/validateLogin');
const jwt = require('jsonwebtoken');
const passport = require('passport');

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

// Passport.js Facebook auth routes
router.get('/facebook', passport.authenticate('facebook', {session: false}));
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login',
    scope: ['email', 'openid', 'profile'],
    session: false
}), (req, res) => {
    let token = jwt.sign(req.user, 'secretkey', {expiresIn: '8h'});
    res.redirect(`${process.env.FRONT_URL}/?token=${token}`);
});

// Passport.js Facebook-token auth route
router.post('/facebook/token', passport.authenticate('facebook-token', {session: false}), (req, res) => {
    if (!req.user) {
        return res.send(401, 'User Not Authenticated');
    } else {
        let token = jwt.sign(req.user, 'secretkey', {expiresIn: '8h'});
        res.json({token});
    }
});


// Passport.js Google auth routes
router.get('/google', passport.authenticate('google', {session: false, scope: ['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    scope: ['email', 'openid', 'profile'],
    session: false
}), (req, res) => {
    let token = jwt.sign(req.user, 'secretkey', {expiresIn: '8h'});
    res.redirect(`${process.env.FRONT_URL}/?token=${token}`);
});

module.exports = router;

