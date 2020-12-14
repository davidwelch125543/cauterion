const { Test } = require('../models/test.model');
const { SupportTicket } = require('../models/ticket.model');
const { User } = require('../models/user.model');
const { PackageQR } = require('../models/packageQr.model');

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

exports.checkPackageValidity = async (req, res) => {
	try {
		const { code } = req.query;
		const packageData = await PackageQR.getByCode(code.toLowerCase());
		if (!packageData) throw new Error('Package QR code is invalid');
		res.status(200).send({ result: packageData });
	} catch (error) {
		console.log('Failed in check package' , error.message);
		res.status(409).send({
			error: { message: error.message }
		});
	}
}

exports.getUserInfoFromQR = async (req, res) => {
  try {
		const { qrUserId } = req.params;

		const qrUserInfo = (await User.getUserById(qrUserId)).Items[0];
		if (!qrUserInfo) throw new Error('Identyfing user process failed)');
		const tests = await Test.getTestsByUserId(qrUserId);
    res.status(200).send({
			result: {
				...qrUserInfo,
				tests: tests && tests.length ? tests : []
			}
		});
  } catch (error) {
    console.log('QR user info error occured', error);
    res.status(400).send(error);
  }
}