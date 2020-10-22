const { User } = require('../models/user.model');
const { Test } = require('../models/test.model');

exports.createFamilyAccount = async (req, res) => {
  try {
		const { id: userId } = req.user;
		const data = User.memberBodyPicker(req.body);
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
		
		const tests = await Test.getTestsByUserId(memberId);

		res.status(200).send({
			result: { ...member, tests }
		});
		
  } catch (error) {
    console.log('Error occured: Add family account: ', error);
    res.status(400).send({ error: error.message });
  }
};
