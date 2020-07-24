const { User } = require('../models/user.model');
const { Test } = require('../models/test.model');

const getUserTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const tests = await Test.getTestsByUserId(userId);
    res.status(200).send(tests);
  } catch (error) {
    console.log('GetUserTests failed with error: ', error);
    res.status(409).send(error.message);
  }
};

const scanTest = async (req, res) => {
  try {
    const data = req.body;
    const user = req.user;
  
    // Get test by serial number
    const test = await Test.getTestBySerialNumber(data.serialNumber);
    let response;
    // If test with provided serial number doesn't exist in DB, create a new one
    if (!test) {
      const newTest = new Test({
        userId: user.id,
        type: data.type,
        serialNumber: data.serialNumber
      });
      await newTest.create();
      response = newTest;
    } else if (test && test.userId === user.id) { // Countinue test's steps after qr scan by providing current test state to client
      response = test;
    } else {
      throw new Error('Test is already used, please contact to support team');
    }
    res.status(200).send(response);
  } catch (error) {
    console.log('Failed in scanTest', error);
    res.status(409).send(error);
  }
};

const updateTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;
    const data = req.body;
    const test = (await Test.getTestById(testId)).Items[0];

    if (!test || test.userId !== userId) throw new Error('Test doesn\'t exist');
  
    const updatableTest = new Test({ ...test, ...data });
    await updatableTest.update();
    res.status(200).send(updatableTest.toModel());
  } catch (error) {
    console.log('Failed in update test', error);
    res.status(409).send(error.message);
  }
};

module.exports = {
  scanTest,
  updateTest,
  getUserTests,
};
