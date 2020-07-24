const MailComposer = require('nodemailer/lib/mail-composer');
const AWS = require('aws-sdk');
const { HtmlForms } = require('./htmlForms');

const SES = new AWS.SES({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});

async function sendEmail(reciever, subject, html) {
  try {
    const mail = new MailComposer({
      from: process.env.AWS_SES_EMAIL,
      to: reciever,
      subject,
      html,
    });

    const message = await mail.compile().build();
    await SES.sendRawEmail({
      RawMessage: {
        Data: message,
      },
    }).promise();
  } catch (error) {
    console.log('Error happend during sending email.', error);
    throw error;
  }
}

class MailSenderManager {
  static async confirmationCode(reciever, code) {
    const subject = 'Email confirmation code';
    const htmlStr = HtmlForms.confirmationCode(code);
    await sendEmail(reciever, subject, htmlStr);
  }
}

module.exports =  { 
  MailSenderManager
};