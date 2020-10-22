// Enable configs
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));
app.use('/members', require('./routes/members'));

// Run server
app.listen(port, () => {
  console.log(`❄️  Server is running 🚀 on ${port} port`);
});