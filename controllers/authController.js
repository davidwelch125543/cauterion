const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MailSenderManager } = require('../lib/ses-lib');
const { SMSSenderManager } = require('../lib/sms-lib');
const { User, AUTH_TYPES } = require('../models/user.model');
const { uploadFileInS3 } = require('../helpers/uploads');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch').default;
const validator = require('validator').default;

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
})

exports.login = async (req, res) => {
  try {
  const { user } = req.body;
  res.status(200).json({
    token: jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, {expiresIn: '8h'})
  });
  } catch (error) {
    console.log('Login failed', error);
    res.status(400).send({ error: error.message });
  }
}

exports.register = async (req, res) => {
  try {
    const data = req.body;
    data.password = bcrypt.hashSync(data.password, 10);
    const generatedCode = Math.floor(1000 + Math.random() * 9000);
		data.code = generatedCode;
		const user = new User(data);
		
		if (user.email) {
			await MailSenderManager.confirmationCode(user.email, user.code);
		} else if (user.phone) {
			await SMSSenderManager.confirmationCode(user.phone, user.code);
		}  
    await user.create();
    res.status(200).send('Registration complete. Confirm your email address or check SMS for activation.');
  } catch (error) {
    console.log('Error occured in registration', error.message);
    res.status(400).send({ error: error.message });
  } 
}

exports.logout = (req, res) => {
    console.log('test')
    req.logout();
    res.status(200).json({msg: 'OK'})
};

exports.forgotPassword = async (req, res) => {
  try {
		const { login } = req.body || {};
		const isEmail = validator.isEmail(login);
		const isPhoneNumber = validator.isMobilePhone(login);

		const randomCode = Math.floor(1000 + Math.random() * 9000);

		let foundUser = null;
		if (isEmail) {
			foundUser = await User.getUserByEmail(login);
			await MailSenderManager.passwordReset(email, randomCode);
		} else if (isPhoneNumber) {
			foundUser = await User.getUserByPhoneNumber(login);
			await SMSSenderManager.passwordReset(foundUser.phone, randomCode);
		}

		if (!foundUser) throw new Error('User is not found');
		
    const updUser = new User({ ...foundUser, resetPasswordCode: randomCode });
    await updUser.update();
    res.status(200).send('You have requested generated code for password reset');
  } catch (error) {
    console.log('Error occured in forgot password', error);
    res.status(409).send({ error: error.message });
  }
};

exports.changeForgottenPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = req.user;
    const updPassword = bcrypt.hashSync(newPassword, 10);
    await User.changePassword(user.id, updPassword);
    res.status(200).send('Password has been succesfully changed!');
  } catch (error) {
    console.log('Error occured in change forgotten password');
    res.status(409).send({ message: error.message });
  }
};

exports.validatePasswordResetCode = async (req, res) => {
  try {
		const { login, code } = req.body;
		const isEmail = validator.isEmail(login);
		const isPhoneNumber = validator.isMobilePhone(login);

		let foundUser = null;

		if (isEmail) {
			foundUser = await User.getUserByEmail(login);
		} else if (isPhoneNumber) {
			foundUser = await User.getUserByPhoneNumber(login);
		}

    if (!foundUser || foundUser.resetPasswordCode !== code) throw new Error('Reset password code is not valid');

    res.status(200).send({
      message: 'Reset code confirmed',
      'password_reset': jwt.sign({ id: foundUser.id, resetPassword: true }, process.env.SECRET_KEY, { expiresIn: '1h' })
    });
  } catch (error) {
    console.log('Error occured in validating password reset code');
    res.status(409).send({ error: error.message });
  }
};

exports.checkConfirmationCode = async (req, res) => {
  try {
		let { user, code } = req.body;
    if (!user || user.active || user.code !== code) throw new Error('Invalid request');
    user = new User({ ...user, active: true });
    await user.update();
    res.status(200).json({
    	token: jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, {expiresIn: '8h'})
    });
  } catch (error) {
    console.log('Error in confirmation', error);
    res.status(409).send({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = (await User.getUserById(userId)).Items[0];
    delete user.password;
    res.status(200).send(user);
  } catch (error) {
    console.log('Get-profile failed with ', error);
    res.status(400).send(error.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = req.body;
    let user = req.user;

    const nationalId = data.nationalId && !data.nationalId.startsWith('http')
      ? (await uploadFileInS3(user.id, data.nationalId, 'national')).url : null;
    const avatar = data.avatar && !data.avatar.startsWith('http')
      ? (await uploadFileInS3(user.id, data.avatar, 'avatar')).url : null;
    if (avatar) data.avatar = avatar;
    if (nationalId) data.nationalId = nationalId;
    
    const { email, password, ...fields } = data;
    const exUser = new User({ ...user, ...fields });
    await exUser.update();
    res.status(200).send('User updated');
  } catch (error) {
    console.log('Failed in update profile', error);
    res.status(400).send(error);
  }
};

exports.googleOAuth = async (req, res) => {
  try {
      if (!req.user) throw new Error('User is not authenticated');
      const token = jwt.sign({ id: req.user.id, email: req.user.email }, process.env.SECRET_KEY, {expiresIn: '8h'});
      res.status(200).send({ token });
  } catch (error) {
      res.status(401).send({ error: error.message });
  }
}

exports.googleSignIn = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const loginTicket = await googleClient.verifyIdToken({
      idToken: tokenId,
    });
    const { sub, email, family_name, given_name } = loginTicket.getPayload();

    let user = await User.getUserByEmail(email);
    // Create a new user if not exists
    if (!user) {
      console.log('Creating a new Google user');
      user = new User({
        id: sub,
        email,
        method: AUTH_TYPES.GOOGLE,
        first_name: given_name,
        last_name: family_name,
      });
      await user.create();
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, {expiresIn: '8h'});
    res.status(200).send({ token });
  } catch (error) {
    console.log('Error occured in Google SignIn: ', error);
    res.status(409).send({ error: error.message });
  }
}

exports.facebookSignIn = async (req, res) => {
  try {
    const { userId, accessToken } = req.body;
    const fbUserInfoGraphURL = `https://graph.facebook.com/${userId}?fields=id,first_name,last_name,email&access_token=${accessToken}`;
    const userInfoPromise = await fetch(fbUserInfoGraphURL, {
      method: 'GET'
    });
    const { id, first_name, last_name, email } = await userInfoPromise.json();
    let user = await User.getUserByEmail(email);
    // Create a new user if not exists
    if (!user) {
      console.log('Creating a new FB user');
      user = new User({
        id,
        email,
        method: AUTH_TYPES.FACEBOOK,
        first_name,
        last_name,
      });
      await user.create();
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, {expiresIn: '8h'});
    res.status(200).send({ token });
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
}