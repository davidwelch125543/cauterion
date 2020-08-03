const { SupportTicket } = require('../models/ticket.model');
const { User } = require('../models/user.model')
const jwt = require('jsonwebtoken');

const loginAsAdmin = async (req, res) => {
  try {
  const { email } = req.body;
  const user = await User.getUserByEmail(email);
  res.status(200).json({
    token: jwt.sign({ id: user.id, email: user.email, type: user.type }, process.env.SECRET_KEY, {expiresIn: '8h'})
  });
  } catch (error) {
    console.log('Login failed', error);
    res.status(400).send({ error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const data = req.body;
    const tickets = await SupportTicket.getSupportTickets(data);
    res.status(200).send(tickets);
  } catch (error) {
    console.log('Get Tickets failed', error);
    res.status(409).send(error);
  }
};

module.exports = {
  loginAsAdmin,
  getTickets,
};
