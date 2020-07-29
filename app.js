// Enable configs
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Express server config
let port = process.env.PORT || 3003;
const app = express();

// Body-parser
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true}))

// Cors config
var corsOptions = {
  credentials: true,
  origin: process.env.WEBSITE_URL,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

//#region MONGODB - OLD verison
// //Set up default mongoose connection
// if (process.env.NODE_ENV === 'production') {
//     console.log('connecting to mongo')
//     // const mongoDB = 'mongodb://127.0.0.1:27017/pavi';
//     const mongoDB = 'mongodb+srv://admin123:davmark11@cluster0-fg4ul.mongodb.net/cauterion';
//     //const mongoDB = 'mongodb://markandrews:davmark11@ds133922.mlab.com:33922/heroku_lk4qc5jc';
//     mongoose.connect(mongoDB, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     }, function (err) {
//         // console.log("Mongo error"+ err)
//         if (err) throw err;
//     });
// } else {
//     // const mongoDB = 'mongodb://localhost:27017/pavi';
//     const mongoDB = 'mongodb+srv://admin123:davmark11@cluster0-fg4ul.mongodb.net/cauterion';
//     mongoose.connect(mongoDB, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });
// }
//#endregion

// Passport.js config
const passport = require('passport');
require('./config/google-passport-strategy')(passport);
require('./config/facebook-passport-strategy')(passport);
app.use(passport.initialize({}));

// Static resources
app.use('/uploads/', express.static(path.join(__dirname, './public/uploads')));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));

// Run server
app.listen(port, () => {
  console.log(`❄️  Server is running 🚀 on ${port} port`);
});