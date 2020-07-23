const dynamoDbLib = require('../lib/dynamodb-lib');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;

const tableName = `users-dev`;

class User {
  constructor(obj) {
    this.id = obj.id;
    this.email = obj.email;
    this.password = obj.password;
    this.code = obj.code;
    this.active = obj.active;
    this.first_name = obj.first_name;
    this.last_name = obj.last_name;
    this.gender = obj.gender;
    this.avatar = obj.avatar;
    this.nationalId = obj.nationalId;
    this.birthday = obj.birthday;
    this.nationality = obj.nationality;
    this.roles = obj.roles || [];
    this.createdAt = obj.createdAt || new Date().getTime();
    this.updatedAt = obj.updatedAt;
  }

  toModel() {
    let model = {
     id: this.id,
     email: this.email,
     password: this.password,
     code: this.code,
     active: this.active,
     first_name: this.first_name,
     last_name: this.last_name,
     gender: this.gender,
     avatar: this.avatar,
     nationalId: this.nationalId,
     birthday: this.birthday,
     nationality: this.nationality,
     roles: this.roles,
     createdAt: this.createdAt,
     updatedAt: this.updatedAt
    };
    model = _.omitBy(model, _.isNil);
    return model;
  }

  async create() {
    const user = this.toModel();
    user.id = uuid();
    user.active = false;
    console.log('User create', user);
    const params = {
      TableName: tableName,
      Item: user,
    };
    return dynamoDbLib.call('put', params);
  }

  static async getUserByEmail(email) {
    const user = (await getItemByGSIFull({
      TableName: 'users-dev',
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
      if (!['id', 'email', 'password', 'createdAt', 'code'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    return response;
  }

  static async delete(id) {
    const params = {
      TableName: tableName,
      Key: {
        id
      },
    };
    const responseData = await dynamoDbLib.call('delete', params);
    console.log('User removed', responseData);
  }
}

module.exports = {
  User,
};
