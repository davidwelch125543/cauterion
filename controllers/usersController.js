const { SupportTicket } = require('../models/ticket.model');

exports.createSupportTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const supportTicket = new SupportTicket({ userId, ...data });
    await supportTicket.create();
    res.status(200).send(supportTicket.toModel());
  } catch (error) {
    console.log('Failed in')
    res.status(409).send(error);
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const tickets = await SupportTicket.getSupportTickets({ userId, ...data });
    res.status(200).send(tickets);
  } catch (error) {
    console.log('Get Tickets failed', error);
    res.status(409).send(error);
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const ticket = (await SupportTicket.getById(ticketId)).Items[0];
    if (ticket.userId !== userId) throw new Error('Access denied');
    res.status(200).send(ticket);
  } catch (error) {
   console.log('Get ticket by Id failed', error);
   res.status(409).send(error);
  }
}

exports.updateOwnTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const data = req.body;
    const updatedTicket = await SupportTicket.update(ticketId, userId, data, 'user');
    res.status(200).send(updatedTicket);
  } catch (error) {
    console.log('Update support ticket failed', error);
    res.status(400).send(error);
  }
}