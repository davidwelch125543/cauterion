const aws = require('aws-sdk');

aws.config.update({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

const s3 = new aws.S3();

async function getS3File(bucket, key) {
  console.log(`Retrieve payload from S3: ${bucket}`);
  const data = await s3.getObject({
    Bucket: bucket || process.env.instanceProcessingBucket,
    Key: key,
    ResponseContentType: 'application/json',
  }).promise();
  return data.Body.toString();
}

const uploadToS3 = (bucketName, filename, filedata) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: filename,
      Body: filedata,
    };
    return s3.putObject(params).promise().then(() => 'Successfully uploaded');
  } catch (error) {
    console.log('Error in uploadToS3', error);
    throw error;
  }
};

const uploadToS3Bucket = ({ bucket, albumName, file }) => new Promise((resolve, reject) => {
  try {
    const fileName = file.name;
    const fileData = file.data;
    const albumKey = `${encodeURIComponent(albumName)}/`;
    const fileKey = albumKey + fileName;
    s3.upload({
      Bucket: bucket,
      Key: fileKey,
      Body: fileData,
      ACL: 'public-read',
    }, (err, data) => {
      if (err) throw new Error(err.message);
      console.log('File upload is done', data);
      resolve(data);
    });
  } catch (error) {
    console.info('Error in file upload', error);
    reject(error);
  }
});

const deletePhoto = ({ photoKey }) => {
  try {
    return s3.deleteObject({ Key: photoKey }, (err, data) => {
      if (err) throw new Error(err.message);
      console.log('Successfully deleted photo.', data);
      return data;
    });
  } catch (error) {
    console.log('error in deletePhoto', error);
    return error;
  }
};

module.exports = {
	uploadToS3Bucket
};
