const { uploadPhoto } = require('../lib/s3_lib');
const fileType = require('file-type');

const S3_BUCKET = 'cauterion';

const uploadImage = async (userId, image, type) => {
  const photoType = fileType(Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  console.log('photoType', photoType);
  if (!['png', 'jpg', 'jpeg'].includes(photoType.ext)) throw new Error('Invalid image type');
  return uploadPhoto({
    image, type, userId: `user_${userId}`, bucket: S3_BUCKET,
  });
};

module.exports = {
  uploadImage
};