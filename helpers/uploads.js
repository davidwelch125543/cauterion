const { uploadToS3Bucket } = require('../lib/s3_lib');
const fileType = require('file-type');

const S3_BUCKET = 'cauterion';

/**
	* @param {string} fileFormat - Defaults is {'image'}. Valid formats - @'image', @'all'
*/
const uploadFileInS3 = async (userId, fileBase64, type, fileFormat = 'image') => {
	let allowedTypes = ['png', 'jpg', 'jpeg'];

	if (fileFormat === 'all') {
		allowedTypes.push('pdf');
	}

	let fileBuffer = fileBase64;
	if (!Buffer.isBuffer(fileBase64)) {
		fileBuffer = Buffer.from(fileBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, ''), 'base64');
	}
	
  const fileInfo = fileType(fileBuffer);
	if (!allowedTypes.includes(fileInfo.ext)) throw new Error('Invalid file extenstion');
	
	const fileName = `${type}${Date.now()}.${fileInfo.ext}`;
	const data = await uploadToS3Bucket({ bucket: S3_BUCKET, albumName: `user_${userId}`, file: { name: `${fileName}`, data: fileBuffer } });
	return {
		url: data.Location,
		ext: fileInfo.ext
	};
};

module.exports = {
  uploadFileInS3,
};