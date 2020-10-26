const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});

const sns = new AWS.SNS();

async function sendSMS(phoneNumber, message) {
  try {
    const params = {
			Message: message,
			PhoneNumber: '+' + phoneNumber,
			MessageAttributes: {
				'AWS.SNS.SMS.SenderID': {
					'DataType': 'String',
					'StringValue': `Cauterion`
				}
			}
		};
	
    const publishTextPromise = sns.publish(params).promise();

    return publishTextPromise.then((data) => {
      return JSON.stringify({ MessageID: data.MessageId });
    }).catch((err) => {
      throw new Error(err);
    });
  } catch (error) {
    console.log('Error happend during sending sms.', error);
    throw error;
  }
}

class SMSSenderManager {
  static async confirmationCode(phoneNumber, code) {
		const message = `Your registration code: ${code}`
    await sendSMS(phoneNumber, message);
	}
	
	static async passwordReset(phoneNumber, code) {
		const message = `Your reset code: ${code}`;
		await sendSMS(phoneNumber, message);
	}
}

module.exports =  {
  SMSSenderManager
};