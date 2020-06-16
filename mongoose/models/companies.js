let mongoose = require('mongoose');
const moment = require('moment');

let CompaniesSchema = new mongoose.Schema({

    name: {
        type: String
    },
    address: {
        type: String
    },
    country: {
        type: String
    },
    phone: {
        type: String
    },
    status: {
        type: String,
        default: false
    },
    created: {
        type: Date,
        default: moment().format()
    }

});

module.exports = mongoose.model('Companies', CompaniesSchema);