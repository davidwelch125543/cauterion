const { SupportTicket } = require('../models/ticket.model');
const { User, USER_TYPES } = require('../models/user.model');
const { Test } = require('../models/test.model');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { PackageQR } = require('../models/packageQr.model');
const uuid = require('uuid').v4;

const adminLogin = async (req, res) => {
  try {
  const { email } = req.body;
  const user = await User.getUserByEmail(email);
  res.status(200).json({
		token: jwt.sign({ id: user.id, email: user.email, type: user.type }, process.env.SECRET_KEY, {expiresIn: '8h'}),
		type: user.type
  });
  } catch (error) {
    console.log('Login failed', error);
    res.status(400).send({ error: error.message });
  }
};

const updateUserData = async (req, res) => {
	try {
		const adminRole = req.user;
		const { userUpdate, testUpdate } = req.body;
		if (![USER_TYPES.ADMIN, USER_TYPES.OPERATOR].includes(adminRole.type) || (adminRole.type === USER_TYPES.OPERATOR && !adminRole.operatorWrAccess)) {
			throw new Error('Operator has not write access to modify user data');
		}
		// Update user info by operator
		if (userUpdate && userUpdate.userId) {
			const user = (await User.getUserById(userUpdate.userId)).Items[0];
			if (![USER_TYPES.MEMBER, USER_TYPES.USER].includes(user.type)) throw new Error('Access denied, can\'t update operators');
			
			// # Health info with upsert
			if (userUpdate.healthInfo) { 
				let newHealthInfo = false;
				if (!userUpdate.healthInfo.id) {
					// Creating
					newHealthInfo = true;
					userUpdate.healthInfo.id = uuid();
					userUpdate.healthInfo.fields.forEach(f => f.id = uuid());
					user.healthInfo = user.healthInfo || [];
					user.healthInfo.push(userUpdate.healthInfo);
					userUpdate.healthInfo = user.healthInfo;
				} else {
					// Updating
					const foundHealthInfoInd = user.healthInfo.findIndex(f => f.id.toString() === userUpdate.healthInfo.id.toString());
					if (!foundHealthInfoInd) throw new Error('Invalid health info element');
					
					userUpdate.healthInfo.fields.forEach(f => { if (!f.id) f.id = uuid(); });
					user.healthInfo[foundHealthInfoInd] = userUpdate.healthInfo;
					userUpdate.healthInfo = user.healthInfo;
				}
			}
		  await User.updateByOperator(userUpdate);
		}

		if (testUpdate && testUpdate.testId) {
			const currentTest = (await Test.getTestById(testUpdate.testId)).Items[0];
			await Test.updateResultByOperator(currentTest, testUpdate.result);
		}
		res.status(200).send('Success');
	} catch (error) {
		console.log('Failed to update user data', error);
		res.status(409).send({ error: error.message });
	}
};

const getTickets = async (req, res) => {
  try {
		const user = req.user;
    const data = req.body;
		const tickets = await SupportTicket.getSupportTickets(data, user);
		if (tickets && Array.isArray(tickets.Items)) {
			await Promise.all(tickets.Items.map(async (item) => {
				const user = (await User.getUserById(item.userId)).Items[0];
				if (user) {
					item.user = _.pick(user, ['first_name', 'last_name', 'email', 'phone', 'type']);
				}
				if (item.operator) {
					const operatorInfo = (await User.getUserById(item.operator)).Items[0];
					if (operatorInfo) item.operatorInfo = _.pick(operatorInfo, ['first_name', 'last_name', 'email', 'phone', 'type']);
				}
			}));
		}
    res.status(200).send(tickets);
  } catch (error) {
    console.log('Get Tickets failed', error);
    res.status(409).send(error);
  }
};

const getTicketsByOperator = async (req, res) => {
  try {
		const { operatorId } = req.params;
    const data = req.body;
		const tickets = await SupportTicket.getSupportTicketsByOperator(data, operatorId);
		if (tickets && Array.isArray(tickets.Items)) {
			await Promise.all(tickets.Items.map(async (item) => {
				const user = (await User.getUserById(item.userId)).Items[0];
				if (user) {
					item.user = _.pick(user, ['first_name', 'last_name', 'email', 'phone', 'type']);
				}
				const operatorInfo = (await User.getUserById(operatorId)).Items[0];
				if (operatorInfo) {
					tickets.operatorInfo = _.pick(operatorInfo, ['first_name', 'last_name', 'email', 'phone', 'type']);
				}
			}));
		}
    res.status(200).send(tickets);
  } catch (error) {
    console.log('Get Tickets failed', error);
    res.status(409).send(error);
  }
};

const getTicketById = async (req, res) => {
  try {
		const user = req.user;
    const ticketId = req.params.id;
		const ticket = (await SupportTicket.getById(ticketId)).Items[0];
		if (user.type === USER_TYPES.OPERATOR && ticket.operator !== user.id) throw new Error('Invalid ticket!');
    res.status(200).send(ticket);
  } catch (error) {
   console.log('Get ticket by Id failed', error);
	 res.status(409).send({ error: error.message });
  }
};

const updateSupportTicket = async (req, res) => {
  try {
		const user = req.user;
    const ticketId = req.params.id;
    const data = req.body;
    const updatedTicket = await SupportTicket.update(ticketId, user.id, data, user.type);
    res.status(200).send(updatedTicket);
  } catch (error) {
    console.log('Update support ticket failed', error);
    res.status(400).send(error);
  }
};

const getUsersList = async (req, res) => {
  try {
    const data = req.body;
    const usersList = (await User.getUsersListForAdmin(data));

		const initializedUserList = [];

		for (const exUser of (usersList.Items || [])) {
			delete exUser.password;
			delete exUser.code;
			delete exUser.resetPasswordCode;

			let tests = (await Test.getTestsByUserId(exUser.id)) || [];
			for (let i = 0; i < tests.length; i++) {
				if (tests[i].result && tests[i].type) {
					tests[i].result = (await PackageQR.getByCode(tests[i].type, tests[i].result)).result;
				}
			}

			const members = (await User.retrieveMembers(exUser.id)).Items;
			
			await Promise.all(members.map(async (mem, memInd) => {
				let memberTests = await Test.getTestsByUserId(mem.id);
				await Promise.all(memberTests.map(async (t, i) => {
					const resData = await PackageQR.getByCode(t.type, t.result);
					memberTests[i].result = resData;
				}));
				members[memInd].tests = memberTests;
			}));

			initializedUserList.push({
				...exUser,
				tests,
				members
			});
		}
		if (usersList.LastEvaluatedKey) initializedUserList.push({ LastEvaluatedKey: usersList.LastEvaluatedKey, Count: usersList.Count });
    res.status(200).send(initializedUserList);
  } catch (error) {
    console.log('Get users list failed', error);
    res.status(409).send(error);
  }
};

const getActiveUsers = async (req, res) => {
	try {
		debugger;
		const operatorId = req.user.id;
		const operatorPendingTickets = (await SupportTicket.getSupportTicketsByOperator({ status: 'pending', limit: 1000 }, operatorId)).Items;
		const operatorRepliedTickets = (await SupportTicket.getSupportTicketsByOperator({ status: 'replied', limit: 1000 }, operatorId)).Items;
		const operatorAllTickets = [...operatorPendingTickets, ...operatorRepliedTickets];
		let groupedTickets = _.groupBy(operatorAllTickets, (ot) => ot.userId);

		let result = await Promise.all(Object.keys(groupedTickets).map(async (userId) => {
			let userInfo = (await User.getUserById(userId)).Items[0];
			delete userInfo.password;
			delete userInfo.code;
			delete userInfo.resetPasswordCode;

			let tests = (await Test.getTestsByUserId(userId)) || [];
			for (let i = 0; i < tests.length; i++) {
				if (tests[i].result && tests[i].type) {
					tests[i].result = (await PackageQR.getByCode(tests[i].type, tests[i].result)).result;
				}
			}
			const members = (await User.retrieveMembers(userId)).Items;
			
			await Promise.all(members.map(async (mem, memInd) => {
				debugger;
				let memberTests = await Test.getTestsByUserId(mem.id);
				await Promise.all(memberTests.map(async (t, i) => {
					const resData = await PackageQR.getByCode(t.type, t.result);
					memberTests[i].result = resData;
				}));
				members[memInd].tests = memberTests;
			}));

			return {
				...userInfo,
				tests,
				members,
			};
		}));
		res.status(200).send(result);
	} catch (error) {
		console.log('Error occured in getting active users');
		res.status(409).send({ error: error.message });
	}
};

const getUserInfo = async (req, res) => {
  try {
    const userId = req.params.id;
    const userInfo = await User.getUserById(userId);
    res.status(200).send(userInfo);
  } catch (error) {
    console.log('Get user info failed', error);
    res.status(409).send(error);
  }
};

module.exports = {
  adminLogin,
  getTickets,
  getTicketById,
  updateSupportTicket,
	getUsersList,
	getActiveUsers,
	getUserInfo,
	getTicketsByOperator,
	updateUserData,
};
