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
	
	static async submitOperator(email, password) {
		const subject = '[Cauterion] - You have been submitted as an operator!'
		const htmlStr = HtmlForms.operatorPasswordTemplate(password);
		await sendEmail(email, subject, htmlStr);
	}

  static async passwordReset(reciever, code) {
    const subject = '[Cauterion] - Password reset request.'
    const htmlStr = HtmlForms.passwordReset(code);
    await sendEmail(reciever, subject, htmlStr);
	}
	
	static async convertToStandaloneAccount(reciever) {
		const subject = '[Cauterion] - Standalone account request'
		const htmlStr = HtmlForms.standaloneAccountConf();
		await sendEmail(reciever, subject, htmlStr);
	}
}

module.exports =  { 
  MailSenderManager
};