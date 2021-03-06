const dynamoDbLib = require('../lib/dynamodb-lib');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;
const { uploadFileInS3 } = require('../helpers/uploads');
const { PackageQR } = require('./packageQr.model');

const table = 'tests-dev';

class Test {
  constructor(obj) {
    this.id = obj.id;
    this.userId = obj.userId;
    this.type = obj.type;
    this.serialNumber= obj.serialNumber;
    this.testStepsPassed = obj.testStepsPassed;
    this.testStepsDate = obj.testStepsDate;
    this.result = obj.result;
    this.image = obj.image;
    this.updatedAt = obj.updatedAt;
    this.createdAt = obj.createdAt || Date.now();
  }

  toModel() {
    let model = {
      id: this.id,
      userId: this.userId,
      type: this.type,
      serialNumber: this.serialNumber,
      testStepsPassed: this.testStepsPassed,
      testStepsDate: this.testStepsDate,
      result: this.result,
      image: this.image,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
    model = _.omitBy(model, _.isNil);
    return model;
  }

  async create() {
    this.id = uuid();
    this.updatedAt = Date.now();
    const test = this.toModel();
    const params = {
      TableName: table,
      Item: test,
    };
    return dynamoDbLib.call('put', params);
  }
  
  static async getTestBySerialNumber(serialNumber) {
    const test = (await getItemByGSIFull({
      TableName: table,
      IndexName: 'serialNumber-index',
      attribute: 'serialNumber',
      value: serialNumber
    })).Items[0];
    return test;
  }

  static async getTestsByUserId(userId) {
    const tests = (await getItemByGSIFull({
      TableName: table,
      IndexName: 'userId-updatedAt-index',
      attribute: 'userId',
      value: userId,
      ScanIndexForward: true
    })).Items;
    return tests;
  }
  
  static async getTestById(testId) {
    const params = {
      TableName: table,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': testId,
      },
    };
    return dynamoDbLib.call('query', params);
  }

  async update() {
    this.updatedAt = Date.now();
    const updatedItem = this.toModel();
    const params = {
      TableName: table,
      Key: {
        id: this.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    // TO DO 12 min expire check 
    const testImage = this.image && !this.image.startsWith('http')
      ? (await uploadFileInS3(this.userId, this.image, 'test')).url : null;
    if (testImage) {
      this.image = testImage;
      updatedItem.image = testImage;
    }
		
		const packageData = await PackageQR.getByCode(this.type);
		const validPackageResult = packageData.results.find(r => r.id === this.result);
		if (!packageData || !validPackageResult) throw new Error('Invalid test result case');

    _.forEach(updatedItem, (item, key) => {
      if (!['id', 'userId', 'type', 'serialNumber', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}
	
	static async updateResultByOperator(currentTest, result) {
		const updatedItem = {
			result,
			updatedAt: Date.now()
		};
    const params = {
      TableName: table,
      Key: {
        id: currentTest.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
		};
		
		const packageData = await PackageQR.getByCode(currentTest.type);
		const validPackageResult = packageData.results.find(r => r.id === result);
		if (!packageData || !validPackageResult) throw new Error('Invalid test result case');

    _.forEach(updatedItem, (item, key) => {
      if (['result', 'updatedAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
  }
}

module.exports = {
  Test
};
