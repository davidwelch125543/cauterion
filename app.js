const express = require('express');
const app = express();

const port = process.env.PORT || 3002;
const server = require('http').createServer(app);
const cors = require('cors');

const path = require('path');


// Cors
app.use(cors(require('./config/cors')));

const bodyParser = require('body-parser');

// Start server on pre-defined port
server.listen(port, () => {
    console.log('server is listening on port ' + port)
});

// Dotenv used to read process.env
require('dotenv').config();

const multer = require('./config/multer');
// Static resources
app.use('/uploads/', express.static(path.join(__dirname, './public/uploads')));

//Import the mongoose module
const mongoose = require('mongoose');

//Set up default mongoose connection
if (process.env.NODE_ENV === 'production') {
    console.log('connecting to mongo')
    // const mongoDB = 'mongodb://127.0.0.1:27017/pavi';
    const mongoDB = 'mongodb+srv://admin123:davmark11@cluster0-fg4ul.mongodb.net/cauterion';
//const mongoDB = 'mongodb://markandrews:davmark11@ds133922.mlab.com:33922/heroku_lk4qc5jc';

    mongoose.connect(mongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err) {
        // console.log("Mongo error"+ err)
        if (err) throw err;
    });
} else {

    // const mongoDB = 'mongodb://localhost:27017/pavi';
    const mongoDB = 'mongodb+srv://admin123:davmark11@cluster0-fg4ul.mongodb.net/cauterion';
    mongoose.connect(mongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}


// Body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Passport.js config
const passport = require('passport');
require('./config/google-passport-strategy')(passport);
require('./config/facebook-passport-strategy')(passport);
app.use(passport.initialize({}));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));




