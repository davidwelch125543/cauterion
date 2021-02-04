const dynamoDbLib = require('../lib/dynamodb-lib');
const { uploadFileInS3 } = require('../helpers/uploads');
const bcrypt = require('bcryptjs');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const { MailSenderManager } = require('../lib/ses-lib');
const _ = require('lodash');
const { default: validator } = require('validator');
const uuid = require('uuid').v4;

const AUTH_TYPES = Object.freeze({
  LOCAL: 'local',
  FACEBOOK: 'facebook',
  GOOGLE: 'google'
});

const USER_TYPES = Object.freeze({
	ADMIN: 'admin',
	OPERATOR: 'operator',
	USER: 'user',
	MEMBER: 'member'
});

const tableName = `users-dev`;

class User {
  constructor(obj) {
    this.id = obj.id;
    this.email = obj.email;
    this.password = obj.password;
    this.code = obj.code;
    this.method = obj.method || AUTH_TYPES.LOCAL;
    this.resetPasswordCode = obj.resetPasswordCode;
		this.active = obj.active;
		this.owner = obj.owner;
		this.operatorWrAccess = obj.operatorWrAccess;
    this.type = obj.type;
    this.first_name = obj.first_name;
    this.last_name = obj.last_name;
    this.phone = obj.phone;
    this.gender = obj.gender;
    this.avatar = obj.avatar;
    this.nationalId = obj.nationalId;
    this.birthday = obj.birthday;
		this.nationality = obj.nationality;
    this.createdAt = obj.createdAt || new Date().getTime();
    this.updatedAt = obj.updatedAt;
  }

  toModel() {
    let model = {
     id: this.id,
     email: this.email,
     password: this.password,
     code: this.code,
     method: this.method,
     resetPasswordCode: this.resetPasswordCode,
		 active: this.active,
		 owner: this.owner,
		 operatorWrAccess: this.operatorWrAccess,
     type: this.type,
     first_name: this.first_name,
     last_name: this.last_name,
     phone: this.phone,
     gender: this.gender,
     avatar: this.avatar,
     nationalId: this.nationalId,
     birthday: this.birthday,
		 nationality: this.nationality,
     createdAt: this.createdAt,
     updatedAt: this.updatedAt
    };
    model = _.omitBy(model, _.isNil);
    return model;
  }

	// #region  USER/ADMIN ----------------------------------------------------------------------
  async create() {
    const user = this.toModel();
    user.id = user.id || uuid();
    user.active = !(this.method === AUTH_TYPES.LOCAL);
    user.type = 'user';
    console.log('User create', user);
    const params = {
      TableName: tableName,
      Item: user,
    };
    return dynamoDbLib.call('put', params);
	}
	
  static async getUsersListForAdmin(data) {
    const usersList = await getItemByGSIFull({
      TableName: tableName,
      IndexName: 'type-createdAt-index',
      attribute: 'type',
      value: 'user',
      LastEvaluatedKey: data.LastEvaluatedKey || null,
      Limit: data.limit || 20
    });
    return usersList;
  }

  static async getUserByEmail(email) {
    const user = (await getItemByGSIFull({
      TableName: tableName,
      IndexName: 'email-index',
      attribute: 'email',
      value: email
    })).Items[0];
    return user;
	}

	static async getUserByPhoneNumber(phone) {
		const user = (await getItemByGSIFull({
      TableName: tableName,
      IndexName: 'phone-index',
      attribute: 'phone',
      value: phone
    })).Items[0];
    return user;
	}
	
	static async getUserByEmail(email) {
    const user = (await getItemByGSIFull({
      TableName: tableName,
      IndexName: 'email-index',
      attribute: 'email',
      value: email
    })).Items[0];
    return user;
  }

  static async getUserById(id) {
    const params = {
      TableName: tableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': id,
      },
    };
    return dynamoDbLib.call('query', params);
  }

  async update() {
    const updateItem = this.toModel();
    const params = {
      TableName: tableName,
      Key: {
        id: this.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    updateItem.updatedAt = new Date().getTime();
    _.forEach(updateItem, (item, key) => {
      if (!['id', 'email', 'password', 'type', 'method', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}
	
	async update() {
    const updateItem = this.toModel();
    const params = {
      TableName: tableName,
      Key: {
        id: this.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    updateItem.updatedAt = new Date().getTime();
    _.forEach(updateItem, (item, key) => {
      if (!['id', 'email', 'password', 'type', 'method', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}
	
	static async convertMemberToAccount(member) {
		const _member = new User(member);
		const updateItem = _member.toModel();
		updateItem.type = USER_TYPES.USER;
		updateItem.active = true;
		updateItem.updatedAt = new Date().getTime();

    const params = {
      TableName: tableName,
      Key: {
        id: updateItem.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    _.forEach(updateItem, (item, key) => {
      if (!['id', 'phone', 'owner', 'method', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}

  static async changePassword(userId, newPassword) {
    const user = (await User.getUserById(userId)).Items[0];
    const updUser = {
      password: newPassword,
      updatedAt: Date.now()
    };
    const params = {
      TableName: tableName,
      Key: {
        id: user.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    _.forEach(updUser, (item, key) => {
      const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
      params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
      params.ExpressionAttributeNames['#' + key] = key;
      params.ExpressionAttributeValues[':' + key] = item;
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}
	
  static async delete(id) {
    const user = (await this.getUserById(id)).Items[0];
    if (user.type === 'admin') throw new Error('Access denied');
    const params = {
      TableName: tableName,
      Key: {
        id
      },
    };
    const responseData = await dynamoDbLib.call('delete', params);
    console.log('User removed', responseData);
	}
	//#endregion
	
	// #region MEMBERS --------------------------------------------------------------------------
	static async memberBodyValidator(data) {
		const body = _.pick(data, ['email', 'first_name', 'last_name', 'nationalId', 'nationality', 'phone', 'gender', 'birthday', 'avatar']);

		let phoneMatchUser = null;
		let emailMatchUser = null;
		let emailPhoneInvalidError = '';
		if (body.phone) {
			const isValidMobile = validator.isMobilePhone(body.phone);
			if (isValidMobile) phoneMatchUser = await this.getUserByPhoneNumber(body.phone);
			else emailPhoneInvalidError.concat('\nInvalid phone number');
		}

		if (body.email) {
			const isValidEmail = validator.isEmail(body.email);
			if (isValidEmail) emailMatchUser = await this.getUserByEmail(body.email); 
			else emailPhoneInvalidError.concat('\nInvalid email address');
		}

		if (emailMatchUser || phoneMatchUser) throw new Error('User with provided email/phone already exists');
		if (emailPhoneInvalidError !== '') throw new Error(`${emailPhoneInvalidError}`);
		return body;
	}

	async addMember(userId) {
			const member = this.toModel();
			member.id = uuid();
			member.owner = userId;
			member.active = false;
			member.type = USER_TYPES.MEMBER;

			const nationalId = member.nationalId && !member.nationalId.startsWith('http')
      	? (await uploadFileInS3(member.id, member.nationalId, 'national')).url : null;
    	const avatar = member.avatar && !member.avatar.startsWith('http')
      	? (await uploadFileInS3(member.id, member.avatar, 'avatar')).url : null;
    	if (avatar) member.avatar = avatar;
    	if (nationalId) member.nationalId = nationalId;

			console.log('Creating member', member);
			const params = {
				TableName: tableName,
				Item: member,
			};
			await dynamoDbLib.call('put', params);
			return member;
	}

	async updateMember(userId, memberId) {
		const member = this.toModel();
		const userData = (await User.getUserById(userId)).Items[0];
		const exMember = (await User.getUserById(memberId)).Items[0];
		
		if (exMember && userData.type === USER_TYPES.OPERATOR) {
			console.log('Member update by operator');
		} else if (!exMember || exMember.owner !== userId) {
			throw new Error('User has not access to update member.');
		}

    const params = {
      TableName: tableName,
      Key: {
        id: memberId,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
		
		const nationalId = member.nationalId && !member.nationalId.startsWith('http')
      ? (await uploadFileInS3(memberId, member.nationalId, 'national')).url : null;
		const avatar = member.avatar && !member.avatar.startsWith('http')
			? (await uploadFileInS3(memberId, member.avatar, 'avatar')).url : null;
		if (avatar) member.avatar = avatar;
		if (nationalId) member.nationalId = nationalId;

    _.forEach(member, (item, key) => {
      if (!['id', 'owner', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}

	static async retrieveMembers(userId, options = {}) {
		const membersList = await getItemByGSIFull({
      TableName: tableName,
      IndexName: 'owner-createdAt-index',
      attribute: 'owner',
      value: userId,
      LastEvaluatedKey: options.LastEvaluatedKey || null,
      Limit: options.limit || 20
    });
    return membersList;
	}
	//#endregion
	
	// #region OPERATORS ------------------------------------------------------------------------
	static async registerOperator(body) {
		const data = _.pick(body, ['first_name', 'last_name', 'email', 'operatorWrAccess']);
		if (!validator.isEmail(data.email)) throw new Error('Email is not valid');
		const exUser = await this.getUserByEmail(data.email);
		if (exUser) throw new Error('Email already exists in system');

		const operator = new User(data);
		const operatorModel = operator.toModel();
		operatorModel.id = uuid();
		operatorModel.type = USER_TYPES.OPERATOR;
		operatorModel.active = true;
		operatorModel.method = AUTH_TYPES.LOCAL;

		const genPassword = Math.random().toString(36).slice(-8);
		const encryptedPassword = bcrypt.hashSync(genPassword, 10);

		operatorModel.password = encryptedPassword;
		await MailSenderManager.submitOperator(operatorModel.email, genPassword);

		const params = {
      TableName: tableName,
      Item: operatorModel,
    };
		await dynamoDbLib.call('put', params);
		delete operatorModel.password;
		return operatorModel;
	}

	static async retrieveOperators() {
		const operators = (await getItemByGSIFull({
			TableName: tableName,
			IndexName: 'type-createdAt-index',
			attribute: 'type',
			value: 'operator',
			ScanIndexForward: true
		})).Items;
		return operators;
	}

	static async updateByOperator(updateItem) {
    const params = {
      TableName: tableName,
      Key: {
        id: updateItem.userId,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
		};
		delete updateItem.userId
    
    updateItem.updatedAt = new Date().getTime();
    _.forEach(updateItem, (item, key) => {
      if (['first_name', 'last_name', 'phone', 'nationality', 'birthday', 'updatedAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}

	static async updateOperatorByAdmin(updateItem) {
    const params = {
      TableName: tableName,
      Key: {
        id: updateItem.operatorId,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
		};
		delete updateItem.operatorId
    
    updateItem.updatedAt = new Date().getTime();
    _.forEach(updateItem, (item, key) => {
      if (['first_name', 'last_name', 'active', 'operatorWrAccess', 'updatedAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
	}
	//#endregion 
}

module.exports = {
  User,
	AUTH_TYPES,
	USER_TYPES
};
