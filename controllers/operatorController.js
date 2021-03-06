const { User } = require('../models/user.model')

const createOperator = async (req, res) => {
  try {
    const operator = await User.registerOperator(req.body);
    res.status(200).send(operator);
  } catch (error) {
    console.log('Error occured in registration operator', error.message);
    res.status(400).send({ error: error.message });
  }
}

const getOperatorsList = async (req, res) => {
	try {
		const operators = await User.retrieveOperators();
    res.status(200).send(operators);
  } catch (error) {
    console.log('Error occured in retrieving operator list', error.message);
    res.status(400).send({ error: error.message });
  }
}

const deleteOperator = async (req, res) => {
	try {
		const { id } = req.params;
		await User.delete(id);
		res.status(200).send('Success');
	} catch (error) {
		console.log('Error occured in removing operator', error.message);
    res.status(400).send({ error: error.message });
	}
}

const updateOperator = async (req, res) => {
	try {
		const data = req.body;
		await User.updateOperatorByAdmin(data);
		res.status(200).send('Success');
	} catch (error) {
		console.log('Error', error);
		res.status(409).send({ error: error.message });
	}
};

module.exports = {
	createOperator,
	getOperatorsList,
	deleteOperator,
	updateOperator,
};
