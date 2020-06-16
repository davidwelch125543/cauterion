// Express Validator
const {body} = require('express-validator');
// const Users = require('../models/users');
// const db = require('../models');
const Users = require('../mongoose/models/users');
// const Users = db.users;

const rules = [
    // body('first_name').not().isEmpty().withMessage('First name is required'),
    // body('last_name').not().isEmpty().withMessage('Last name is required'),
    body('email').not().isEmpty().withMessage('E-mail is required').isEmail().withMessage('E-mail is invalid'),
    body('password', 'Password is required').not().isEmpty(),
    // body('gender', 'Gender is required').not().isEmpty(),
    // body('user_type', 'User type is required').not().isEmpty(),
    // body('field_type')
    //     .custom(async (type, {req}) => {
    //         let data = req.body;
    //         if (data.user_type === 'customer') return true;
    //         else if (!data.field_type) {
    //             throw new Error('Field type is required');
    //         }
    //         return true;
    //     }),
    body().custom(async (req) => {
        let email = req.email;

        console.log('validating register')
        console.log(email)

        // Retrieving a user with request email
        // let user = await Users.findOne({where: {email: email}});
        let user = await Users.findOne({email: email});
        console.log(user)

        if (user != null) throw new Error('E-mail exists');

        // return true;
    }),

];

module.exports = {
    rules
};
