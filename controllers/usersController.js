const Users = require('../mongoose/models/users');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.addTest = async (data, res) => {
    // let user = await Users.findOne({email: data.email});
    //
    // if (user.tests.find(d => d.pn === data.pn)) {
    //     res.status(500).json('A test with such P/N or name is taken')
    // } else {
    //     // if (!user.tests) user.tests = [];
    //     data.test.front_id = jwt.sign(data, 'secretkey', {expiresIn: '8h'});
    //     data.test.date_val = moment().format('YYYY-MM-DD hh:mm:ss');
    //     console.log(data.test)
    //     user.tests.push(data.test);
    //
    //     user.save();
    //     res.json('OK');
    // }


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

};


exports.checkTestSerialNumber = async (req, res) => {
    let data = req.query;
    let user = await Users.findOne({email: data.email});
    if (user) {
        let testFound = user.tests.find(d => d.pn === data.pn);

        if (testFound) {
            res.status(500).json('A test with such p/n exists');
        } else {
            res.json('OK');
        }
    } else {
        res.status(500).json('A user with such email is not found');
    }
};


exports.uploadImage =  function (req, res) {
  try {
    const filePath = req.file ? req.file.location : null;
    res.status(200).send(filePath);
  } catch (error) {
    res.status(400).send('Image upload failed', error);
  }
}

exports.updateTestImages = async (req, res) => {
    let data = req.body;

    console.log('upload images')
    uploadImages(req, res, async (err) => {
        let user = await Users.findOne({email: data.email});

        if (user.tests.find(d => d.pn === data.pn)) {
            res.status(500).json('A test with such P/N or name is taken')
        } else {
            if (!user.tests) user.tests = [];

            data.front_id = jwt.sign(data, 'secretkey', {expiresIn: '8h'});
            data.date_val = moment().format('YYYY-MM-DD hh:mm:ss');
            delete data.email;
            user.tests.push(data);


            user.save();
            res.json('OK');
        }
        // console.log('here')
        // let user = await Users.findOne({email: data.email});
        //
        // let testFound = user.tests.find(d => d.pn === data.pn);
        // console.log(testFound);
        // if (testFound) {
        //
        //     testFound.image = data.image;
        //     user.save();
        //     res.json('OK');
        // } else {
        //     res.status(500).json('Test is not found');
        // }
    })
};

exports.updateTestResult = async (req, res) => {
    let data = req.body;
    let user = await Users.findOne({email: data.email});

    let testFound = user.tests.find(d => d.pn === data.pn);

    if (testFound) {
        testFound.result = data.result;
        user.save();
        res.json(user);
    } else {
        res.status(500).json('Test is not found');
    }
};
