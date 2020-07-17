const aws = require('aws-sdk');

aws.config.update({
  region: process.env.AWS_REGION,
});

const call = (action, params) => {
  const dynamoDb = new aws.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET });
  return dynamoDb[action](params).promise();
};

module.exports =  {
  call,
};
