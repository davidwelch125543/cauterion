const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/add-test', usersController.addTest);
router.get('/check-test-serial-number', usersController.checkTestSerialNumber);
router.post('/upload-test-images', usersController.updateTestImages);
// router.put('/update-test-result', uploadImages, usersController.updateTestResult);

module.exports = router;
