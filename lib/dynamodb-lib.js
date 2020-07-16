const aws = require('aws-sdk');

aws.config.update({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
});

const call = (action, params) => {
  const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET });
  return dynamoDb[action](params).promise();
};

module.exports =  {
  call,
};
