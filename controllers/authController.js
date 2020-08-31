const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { MailSenderManager } = require('../lib/ses-lib');
const { User } = require('../models/user.model');
const { uploadImage } = require('../helpers/uploads');

exports.login = async (req, res) => {
  try {
    // Selecting an employee that has an email matching request one
  const { email } = req.body;
  const user = await User.getUserByEmail(email);
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
    await MailSenderManager.confirmationCode(user.email, user.code);
    await user.create(); 
    res.status(200).send('Registration complete. Confirm your email address for activation.');
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
    const { email } = req.body;
    let foundUser = await User.getUserByEmail(email);
    if (!foundUser) throw new Error('User is not found');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    await MailSenderManager.passwordReset(email, randomCode);
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
    await User.changePassword(user.email, updPassword);
    res.status(200).send('Password has been succesfully changed!');
  } catch (error) {
    console.log('Error occured in change forgotten password');
    res.status(409).send({ message: error.message });
  }
};

exports.validatePasswordResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.getUserByEmail(email);
    if (!user || user.resetPasswordCode !== code) throw new Error('Reset password code is not valid');

    res.status(200).send({
      message: 'Reset code confirmed',
      'password_reset': jwt.sign({ id: user.id, resetPassword: true }, process.env.SECRET_KEY, { expiresIn: '1h' })
    });
  } catch (error) {
    console.log('Error occured in validating password reset code');
    res.status(409).send({ error: error.message });
  }
};

exports.checkConfirmationCode = async (req, res) => {
  try {
    const data = req.body;
    let user = await User.getUserByEmail(data.email);

    if (!user || user.active || user.code !== data.code) throw new Error('Invalid request');
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
      ? (await uploadImage(user.id, data.nationalId, 'national')).Location : null;
    const avatar = data.avatar && !data.avatar.startsWith('http')
      ? (await uploadImage(user.id, data.avatar, 'avatar')).Location : null;
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
