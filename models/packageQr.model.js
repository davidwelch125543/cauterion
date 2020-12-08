const dynamodbLib = require('../lib/dynamodb-lib');
const dynamoDbLib = require('../lib/dynamodb-lib');

const table = 'packageQrs-dev';

class PackageQR {

  static async create(qrCode) {
    const params = {
      TableName: table,
      Item: { name: qrCode },
    };
    return dynamoDbLib.call('put', params);
	}

  static async getCodes() {
		const params = { TableName: table };
		let codes = [];
		let chunkCodes;
		do {
			chunkCodes = await dynamoDbLib.call('scan', params);
			chunkCodes.Items.forEach((cc) => codes.push(cc));
			params.ExclusiveStartKey = chunkCodes.LastEvaluatedKey;
		} while (typeof chunkCodes.LastEvaluatedKey != 'undefined');

		return codes;
  }
}

module.exports = {
  PackageQR,
};
