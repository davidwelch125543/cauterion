const express = require('express');
const router = express.Router();
const { AuthorizerMiddleware } = require('../middlewares/middleware.authorizer');
const usersController = require('../controllers/usersController');
const testsController = require('../controllers/testsController');

router.post('/tests/scan', AuthorizerMiddleware, testsController.scanTest);
router.put('/tests/:id', AuthorizerMiddleware, testsController.updateTest);
router.get('/check-test-serial-number', usersController.checkTestSerialNumber);
router.post('/upload-test-images', usersController.updateTestImages);
// router.put('/update-test-result', uploadImages, usersController.updateTestResult);

module.exports = router;
