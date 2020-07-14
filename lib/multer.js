const multer = require('multer');
const fse = require('fs-extra');
const path = require('path');

// define multer storage configuration     
const storage = multer.diskStorage({
  destination : function (req, file, callback) {
    console.log('1')
    const dir = path.join(__dirname, '../public/uploads/users');
    fse.ensureDirSync(dir);
    callback(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

const fileFilter = function (req, file, callback) {
  console.log('1')
  // accept image only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const upload = multer({ storage, fileFilter });
upload.single('avatar');


module.exports = {
  uploadProfile: upload.single('profileImage'),
  uploadTest: upload.single('test'),
  uploadNationalId: upload.single('nationalId'),
};
