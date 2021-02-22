// Enable configs
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

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

const swaggerServers = process.env.NODE_ENV === 'production'
 ? [{ url:'http://appcauterion-env.eba-gvqwx8a2.eu-central-1.elasticbeanstalk.com/' }]
 : [{ url: 'http://localhost:3003/' }, { url: 'http://appcauterion-env.eba-gvqwx8a2.eu-central-1.elasticbeanstalk.com/' }];

const swaggerDocs = swaggerJsDoc({
	definition:{
		openapi: "3.0.0",
		info: {
			title: 'Cauterion Express API with Swagger',
			version: '0.1.0',
			description: 'Web & mobile API',
		},
		servers: swaggerServers,
	},
	apis: ['./swagger/swagger.*.js']
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));
app.use('/members', require('./routes/members'));

app.use('/documentation', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Run server
app.listen(port, () => {
  console.log(`❄️  Server is running 🚀 on ${port} port`);
});