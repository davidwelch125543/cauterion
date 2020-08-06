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

exports.logout = (req, res) => {
    console.log('test')
    req.logout();
    res.status(200).json({msg: 'OK'})
};

exports.sendConfirmationCode = (req, res) => {

    let data = req.body;
    let email = data.email;
    let randomCode = data.code;

// create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465, // 587
      secure: true, // true for 465, false for other ports
      auth: {
          user: 'sofiabruno3003', // generated ethereal user
          pass: 'davmark11' // generated ethereal password
      }
    });


    // setup email data with unicode symbols
    let mailOptions = {
        from: 'Cauterion', // sender address
        to: email, // list of receivers
        subject: 'Email confirmation code', // Subject line
        text: 'This is your confirmation code', // plain text body
        html: `${randomCode}` // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        console.log(error)
        if (error) {
            res.status(500).json({msg: error.toString()})
        } else if (info) {

            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.json('The confirmation code has been sent successfully');
        }
    });
};

exports.register = async (req, res) => {
  try {
    const data = req.body;
    data.password = bcrypt.hashSync(data.password, 10);
    const generatedCode = Math.floor(1000 + Math.random() * 9000);
    data.code = generatedCode;
    const user = new User(data);
    await MailSenderManager.confirmationCode(user.email, user.code);
    await user.create(); 
    res.status(200).send('Registration complete');
  } catch (error) {
    res.status(400).send(error);
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

exports.forgotPassword = async (req, res) => {
// Getting validation result from express-validator
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json(errors.array()[0]);
//     }
    const user = req.body;
    console.log('forgot password!!!')
    let foundUser = await User.getUserByEmail(user.email);
    console.log(user)

    if (!foundUser) {
        res.status(500).json('User is not found');
    } else {
        const email = user.email;

        // let tempToken = jwt.sign({
        //     email: user.email,
        //     id: user.id,
        //
        //     first_name: user.first_name,
        //     last_name: user.last_name,
        //     company_id: user.company_id,
        //     gender: user.gender,
        //     field_type: user.field_type,
        //     user_type: user.user_type
        // }, 'secretkey', {expiresIn: '1h'});

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'sofiabruno3003', // generated ethereal user
                pass: 'davmark11' // generated ethereal password
            }
        });

        let randomCode = Math.floor(1000 + Math.random() * 9000);
        console.log("CODE" + randomCode)
        // console.log(process.env)

        // setup email data with unicode symbols
        let mailOptions = {
            from: 'Cauterion', // sender address
            to: email, // list of receivers
            subject: 'Password Reset', // Subject line
            text: 'You recently requested a password reset', // plain text body
            html: `${randomCode}` // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            console.log(error)
            if (error) {
                res.status(500).json({msg: error.toString()})
            } else if (info) {

                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                res.json(randomCode);
            }
        });
    }
};

exports.changeForgottenPassword = async (req, res) => {
  console.log('here!!!!')
  let data = req.body;
  let newPassword = data.new_password;
  let foundUser = await User.getUserByEmail(data.email);
  if (!foundUser) {
    res.status(500).json('User is not found');
  } else {
    data.password = bcrypt.hashSync(newPassword, 10);
    // await Users.updateOne({password: data.password}, {email: data.email});
    res.json('OK')
  }
};
