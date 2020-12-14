const { getItemByGSIFull } = require('../lib/dynamo-requests');
const dynamoDbLib = require('../lib/dynamodb-lib');
const uuid = require('uuid').v4;
const table = 'testPackages_dev';

class PackageQR {
	constructor(params) {
		this.id = params.id;
		this.code = params.code;
		this.type = params.type;
		this.results = params.results;
	}

	toModel() {
		return {
			id: this.id,
			code: this.code,
			type: this.type,
			results: this.results
		};
	}

  async create() {
		this.id = uuid();
		if (!code || !type) throw new Error('Code or type missing fields');
		const item = this.toModel();
    const params = {
      TableName: table,
      Item: item,
    };
    return dynamoDbLib.call('put', params);
	}

	static async getByCode(packageCode, resultId) {
    let data = (await getItemByGSIFull({
      TableName: table,
      IndexName: 'code-index',
      attribute: 'code',
      value: packageCode,
		})).Items[0];
		if (data && resultId) {
			const result = data.results.find(r => r.id === resultId);
			delete data.results;
			data.result = result;
		}
    return data;
  }

  static async getPackagesAll() {
		const params = { TableName: table };
		let packages = [];
		let chunkCodes;
		do {
			chunkCodes = await dynamoDbLib.call('scan', params);
			chunkCodes.Items.forEach((cc) => packages.push(cc));
			params.ExclusiveStartKey = chunkCodes.LastEvaluatedKey;
		} while (typeof chunkCodes.LastEvaluatedKey != 'undefined');

		return packages;
  }
}

module.exports = {
  PackageQR,
};
