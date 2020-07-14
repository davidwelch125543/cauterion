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

const addPhoto = ({ bucket, albumName, img }) => new Promise((resolve, reject) => {
  try {
    const fileName = img.name;
    const imgData = img.data;
    const albumPhotosKey = `${encodeURIComponent(albumName)}/`;
    const photoKey = albumPhotosKey + fileName;
    s3.upload({
      Bucket: bucket,
      Key: photoKey,
      Body: imgData,
      ACL: 'public-read',
    }, (err, data) => {
      if (err) throw new Error(err.message);
      console.log('Add photo is done', data);
      resolve(data);
    });
  } catch (error) {
    console.info('Error in add photo', error);
    reject(error);
  }
});

const uploadPhoto = async ({
  image, type, userId, bucket,
}) => {
  try {
    const imgName = `${type}${Date.now()}.jpg`;
    const data = await addPhoto({ bucket, albumName: userId, img: { name: `${imgName}`, data: Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64') } });
    return data;
  } catch (error) {
    console.log('Error in uploadPhoto', error);
    return error;
  }
};

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
  uploadPhoto
};
