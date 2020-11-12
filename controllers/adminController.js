const { SupportTicket } = require('../models/ticket.model');
const { User, USER_TYPES } = require('../models/user.model')
const jwt = require('jsonwebtoken');
const _ = require('lodash');

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

const getTickets = async (req, res) => {
  try {
		const user = req.user;
    const data = req.body;
		const tickets = await SupportTicket.getSupportTickets(data, user);
		if (tickets && Array.isArray(tickets.Items)) {
			await Promise.all(tickets.Items.map(async (item) => {
				const user = (await User.getUserById(item.userId)).Items[0];
				if (user) {
					item.user = _.pick(user, ['first_name', 'last_name', 'email', 'phone']);
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
   res.status(409).send(error);
  }
}

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
}

const getUsersList = async (req, res) => {
  try {
    const data = req.body;
    const usersList = await User.getUsersListForAdmin(data);
    res.status(200).send(usersList);
  } catch (error) {
    console.log('Get users list failed', error);
    res.status(409).send(error);
  }
}

const getUserInfo = async (req, res) => {
  try {
    const userId = req.params.id;
    const userInfo = await User.getUserById(userId);
    res.status(200).send(userInfo);
  } catch (error) {
    console.log('Get user info failed', error);
    res.status(409).send(error);
  }
}

module.exports = {
  adminLogin,
  getTickets,
  getTicketById,
  updateSupportTicket,
  getUsersList,
  getUserInfo
};
