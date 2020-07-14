const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { S3UploaderMiddleware } = require('../lib/multer_s3');

// router.post('/add-test', usersController.addTest);
router.get('/check-test-serial-number', usersController.checkTestSerialNumber);
router.post('/upload-test-images', usersController.updateTestImages);
router.post('/upload-image', S3UploaderMiddleware('tests', 'test'), usersController.uploadImage);
// router.put('/update-test-result', uploadImages, usersController.updateTestResult);

module.exports = router;
