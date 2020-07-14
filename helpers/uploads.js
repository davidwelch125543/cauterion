const { uploadPhoto } = require('../lib/s3_lib');
const fileType = require('file-type');

const uploadAvatar = async (image, userId) => {
  const photoType = fileType(Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  console.log('photoType', photoType);
  if (!['png', 'jpg', 'jpeg'].includes(photoType.ext)) throw new Error('Invalid image type');
  return uploadPhoto({
    image, type: 'avatar', userId: `user_${userId}`, bucket: 'cauterion',
  });
};

module.exports = {
  uploadAvatar
}