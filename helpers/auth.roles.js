const { USER_TYPES } = require("../models/user.model");

module.exports = {
	ADMIN_PANEL: [USER_TYPES.ADMIN, USER_TYPES.OPERATOR],
	SIMPLE_USER: [USER_TYPES.USER, USER_TYPES.MEMBER]
};