const sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const Users = require('../mongoose/models/users');
const bcrypt = require('bcryptjs');
const showIfErrors = require('../helpers/showIfErrors');
const nodemailer = require('nodemailer');

exports.login = async (req, res) => {

    // Checking validation result from express-validator
    if (!showIfErrors(req, res)) {
        // Getting request data and setting user fields to return
        let data = req.body;
        let email = data.email.trim();

        // let attributes = [`first_name`, `last_name`, 'email', 'profile_img', 'password', 'id', 'status_id'];
        //
        // // Active status selecting
        // let statusWhere = sequelize.where(sequelize.col('`users_status`.`name_en`'), 'active');

        console.log('login')
        console.log(data)


        // Selecting an employee that has an email matching request one
        let user = await Users.findOne({email: email});


        if (!res.headersSent) {


            // User is not active
            if (!user) res.status(500).json({msg: 'You don\'t have such privileges or the account is inactive'});

            else {
                // Cloning users object without password and saving user full name
                let {password, ...details} = user.toJSON();
                // let full_name = user[`first_name`] + ' ' + user[`last_name`];


                res.status(200).json({
                    token: jwt.sign(details, 'secretkey', {expiresIn: '8h'})
                })
            }


        }
    }
};

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
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
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
    if (!showIfErrors(req, res)) {

        let data = {...req.body, ...{first_name: '', last_name: '', nationality: '', gender: '', birthday: ''}};
        // Saving the original password of user and hashing it to save in db
        let originalPass = data.password;
        data.password = bcrypt.hashSync(originalPass, 10);



        let randomCode = Math.floor(1000 + Math.random() * 9000);
        console.log("CODE: " + randomCode)
        data.code = randomCode;
        req.body = data;
        console.log(data)
        // console.log(process.env)

        let user = new Users(data);
        await user.save();

        // Saving the original password again to request for authenticating the user at once
        data.password = originalPass;


        // console.log(data)

        this.sendConfirmationCode(req, res);
    }


    //
};

exports.checkConfirmationCode = async (req, res) => {
    let data = req.body;
    console.log(data)
    let user = await Users.findOne({email: data.email, code: data.code});

    if (user) {
        // Users.updateOne({email:data},{active:true})
        user.active = true;
        await user.save();
        // if (!data.forgot) {
            this.login(req, res);
        // } else return true;
        // res.json('The code has been confirmed successfully');
    } else {
        res.status(500).json('Wrong confirmation code');
        return false;
    }
};


/**
 * Gets profile data of current authenticated user
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
exports.getProfile = async (req, res) => {

    const data = req.query;
    const email = data.email;


    // Selecting an employee that has an email matching request one
    let user = await Users.findOne({
        email: email
    });
    res.json(user);
};


exports.updateProfile = async (req, res) => {

    let data = req.body;

    uploadProfileImg(req, res, async (err) => {
        // Gets file type validation error
        if (req.fileTypeError) {
            res.status(423).json(req.fileTypeError);
        }

        // Getting multer errors if any
        else if (err) res.status(423).json(err);

        // If file validation passed, heading to the request data validation
        else {
            if (!showIfErrors(req, res)) {


                // Cloning user object without id and language to build update fields
                let {id, lang, ...fields} = data;

                console.log(fields)

                delete fields.email; //temporary
                let result = await Users.updateOne({_id: data._id}, fields);
                res.json(result)
            }
        }
    })


};


exports.forgotPassword = async (req, res) => {
// Getting validation result from express-validator
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json(errors.array()[0]);
//     }
    const user = req.body;
    console.log('forgot password!!!')
    let foundUser = await Users.findOne({email: user.email});
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

    // if (this.checkConfirmationCode(req, res)) {
        let foundUser = await Users.findOne({email: data.email});


        if (!foundUser) {
            res.status(500).json('User is not found');
        } else {

            data.password = bcrypt.hashSync(newPassword, 10);

            await Users.updateOne({password: data.password}, {email: data.email});
            res.json('OK')
        }
    // }


};
