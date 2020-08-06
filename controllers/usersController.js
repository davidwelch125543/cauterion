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