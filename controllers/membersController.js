const { User } = require('../models/user.model');
const { Test } = require('../models/test.model');
const { MailSenderManager } = require('../lib/ses-lib');
const { PackageQR } = require('../models/packageQr.model');

exports.createFamilyAccount = async (req, res) => {
  try {
		const { id: userId } = req.user;
		const data = await User.memberBodyValidator(req.body);
		const currentUser = new User(data);
		const member = await currentUser.addMember(userId);

		res.status(200).send({
			result: member
		});
  } catch (error) {
    console.log('Error occured: Add family account: ', error);
    res.status(400).send({ error: error.message });
  }
};

exports.updateMember = async (req, res) => {
	try {
		const { id: userId } = req.user;
		const { memberId } = req.params;
		const data = await User.memberBodyValidator(req.body);

		const currentUser = new User(data);
		const member = await currentUser.updateMember(userId, memberId);

		res.status(200).send({
			result: member
		});
  } catch (error) {
    console.log('Error occured: Add family account: ', error);
    res.status(400).send({ error: error.message });
  }
}

exports.getMembersList = async (req, res) => {
  try {
		const { id: userId } = req.user;
		const membersList = await User.retrieveMembers(userId);

		res.status(200).send({
			result: membersList
		});
  } catch (error) {
    console.log('Error occured: Add family account: ', error);
    res.status(400).send({ error: error.message });
  }
};

exports.getMemberById = async (req, res) => {
	try {
		const { id: userId } = req.user;
		const { memberId } = req.params;

		const member = (await User.getUserById(memberId)).Items[0];
		if (!member || member.owner !== userId) throw new Error('Invalid memberId');
		
		let tests = await Test.getTestsByUserId(memberId);
		await Promise.all(tests.map(async (t, i) => {
			const resData = await PackageQR.getByCode(t.type, t.result);
			tests[i].result = resData;
		}));

		res.status(200).send({
			result: { ...member, tests }
		});
  } catch (error) {
    console.log('Error occured: Add family account: ', error);
    res.status(400).send({ error: error.message });
  }
};

exports.requestForStandaloneAccount = async (req, res) => {
	try {
		const { id: userId } = req.user;
		const { memberId, email } = req.body;
		const member = (await User.getUserById(memberId)).Items[0];
		if (!member || member.owner !== userId) throw new Error('Invalid memberId');
		if (!member.email && !email) throw new Error('Provide email address');
		member.email = member.email || email;

		// Check email availability
		const validUser = await User.getUserByEmail(member.email);
		if (!validUser) throw new Error('User with provided email already exists');

		await MailSenderManager.convertToStandaloneAccount(member.email);
		await User.convertMemberToAccount(member);
		res.status(200).send('Success');
	} catch (error) {
		console.log('Standalone acc. request failed', error);
		res.status(409).send({ message: error.message });
	}
}