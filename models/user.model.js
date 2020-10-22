const dynamoDbLib = require('../lib/dynamodb-lib');
const { uploadImage } = require('../helpers/uploads');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;

const AUTH_TYPES = Object.freeze({
  LOCAL: 'local',
  FACEBOOK: 'facebook',
  GOOGLE: 'google'
});

const USER_TYPES = Object.freeze({
	ADMIN: 'admin',
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

  static async changePassword(email, newPassword) {
    const user = await User.getUserByEmail(email);
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
	
	
	// MEMBERS -------------------------------------------------------------------------------
	static memberBodyPicker(data) {
		const body = _.pick(data, ['email', 'first_name', 'last_name', 'nationalId', 'nationality', 'phone', 'gender', 'birthday', 'avatar']);
		return body;
	}

	async addMember(userId) {
			const member = this.toModel();
			if (this.email) {
				const exUser = await User.getUserByEmail(this.email);
				if (exUser) throw new Error('User with provided email already exist');
			}
			member.id = uuid();
			member.owner = userId;
			member.active = false;
			member.type = USER_TYPES.MEMBER;

			const nationalId = member.nationalId && !member.nationalId.startsWith('http')
      	? (await uploadImage(member.id, member.nationalId, 'national')).Location : null;
    	const avatar = member.avatar && !member.avatar.startsWith('http')
      	? (await uploadImage(member.id, member.avatar, 'avatar')).Location : null;
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
}

module.exports = {
  User,
  AUTH_TYPES,
};
