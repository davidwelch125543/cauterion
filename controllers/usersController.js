const Users = require('../mongoose/models/users');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.addTest = async (req, res) => {
    let data = req.body;
    let user = await Users.findOne({email: data.email});

    if (user.tests.find(d => d.pn === data.pn || d.name === data.name)) {
        res.status(500).json('A test with such P/N or name is taken')
    } else {
        // if (!user.tests) user.tests = [];
        data.test.front_id = jwt.sign(data, 'secretkey', {expiresIn: '8h'});
        data.test.date_val = moment().format('YYYY-MM-DD hh:mm:ss');
        console.log(data.test)
        user.tests.push(data.test);

        user.save();
        res.json('OK');
    }


    // await Users.bulkWrite(
    //     data.map((dt) =>
    //         ({
    //             updateOne: {
    //                 filter: {
    //                     email:data.email
    //                 },
    //                 update: {
    //                     $set: dt
    //                 },
    //                 upsert: true
    //             }
    //         })
    //     ));

}


exports.updateTestSerialNumber = async (req, res) => {
    let data = req.body;
    console.log(data)
    let user = await Users.findOne({email: data.email});

    if (user) {
        let testFound = user.tests.find(d => d.test_name === data.test_name);

        if (testFound) {
            testFound.pn = data.pn;
            user.save();
            res.json('OK');
        } else {
            res.status(500).json('A test with such name is not found');
        }
    } else {
        res.status(500).json('A user with such email is not found');
    }
};

exports.updateTestImages = async (req, res) => {
    let data = req.body;

    console.log(data)
    uploadImages(req, res, async (err) => {
        console.log('here')
    })
};
