const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');


router.post('/add-test', usersController.addTest);
router.put('/update-test-serial-number', usersController.updateTestSerialNumber);
router.post('/upload-test-images', uploadImages, usersController.updateTestSerialNumber);


module.exports = router;
