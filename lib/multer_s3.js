const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const S3_FOLDERS = {
  PROFILE_IMG: 'profiles',
  TEST: 'tests',
  NATIONAL_ID: 'national_Ids'
};

const S3_FILE_KEY = {
  PROFILE_IMG: 'profileImg',
  TEST: 'test',
  NATIONAL_ID: 'nationalId'
};

aws.config.update({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

const s3 = new aws.S3();

function S3UploaderMiddleware(folder, singleFileKey) {
  const uploadMulterS3 = multer({
    storage: multerS3({
        s3,
        acl: 'public-read',
        bucket: `cauterion/${folder}`,
        key: function (req, file, cb) {
            console.log('Req', req);
            console.log(file);
            cb(null, `${file.fieldname}_${Date.now()}.${file.originalname.split('.')[1]}`);
          }
      })
    });
  return uploadMulterS3.single(singleFileKey);
}

module.exports = {
  S3UploaderMiddleware,
  S3_FOLDERS,
  S3_FILE_KEY
};
