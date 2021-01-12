const { User } = require('../models/user.model');
const { Test } = require('../models/test.model');
const { PackageQR } = require('../models/packageQr.model');

const getUserTests = async (req, res) => {
  try {
    const userId = req.user.id;
		let tests = await Test.getTestsByUserId(userId);
		await Promise.all(tests.map(async (t, i) => {
			const resData = await PackageQR.getByCode(t.type, t.result);
			const testedByUser =  (await User.getUserById(t.userId)).Items[0];
			tests[i].testedBy = `${testedByUser.first_name} ${testedByUser.last_name}`;
			tests[i].result = resData;
		}));
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
		
		const packageInfo = await PackageQR.getByCode((data.type || 'null').toLowerCase());
		if (!packageInfo) throw new Error('Invalid type provided');

		if (data.memberId) {
			const memberUser = (await User.getUserById(data.memberId)).Items[0];
			if (!memberUser || memberUser.owner !== user.id) throw new Error('Invalid member id');
			user.id = data.memberId;
		}
		
    // Get test by serial number
    const test = await Test.getTestBySerialNumber(data.serialNumber);
    let response;
    // If test with provided serial number doesn't exist in DB, create a new one
    if (!test) {
      const newTest = new Test({
        userId: user.id,
        type: data.type.toLowerCase(),
        serialNumber: data.serialNumber
      });
      await newTest.create();
      response = newTest;
    } else if (test && test.userId === user.id) { // Countinue test's steps after qr scan by providing current test state to client
      response = test;
    } else {
      // Test support page (200 code with response)
      response = {
        message: 'Test code is already used, please contact to support team',
        supportPage : true
      };
    }
    res.status(200).send(response);
  } catch (error) {
    console.log('Failed in scanTest', error);
    res.status(409).send(error);
  }
};

const updateTest = async (req, res) => {
  try {
    let userId = req.user.id;
    const testId = req.params.id;
    const data = req.body;
    const test = (await Test.getTestById(testId)).Items[0];

		if (data.memberId) {
			const memberUser = (await User.getUserById(data.memberId)).Items[0];
			if (!memberUser || memberUser.owner !== userId) throw new Error('Invalid member id');
			userId = data.memberId;
		}

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
