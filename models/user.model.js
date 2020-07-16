const tableName = `Users-dev`;
const dynamoDbLib = require('../lib/dynamodb-lib')
const _ = require('lodash');

class User {
  constructor(obj) {
    this.id = obj.id;
    this.email = obj.email;
    this.password = obj.password;
    this.code = obj.code;
    this.active = obj.active;
    this.firstName = obj.firstName;
    this.lastName = obj.lastName;
    this.gender = obj.gender;
    this.avatar = obj.avatar;
    this.birthday = obj.birthday;
    this.nationality = obj.nationality;
    this.roles = obj.roles || [];
    this.tests = obj.tests || [];
    this.createdAt = obj.createdAt || new Date().getTime();
    this.updatedAt = obj.updatedAt || new Date().getTime();
  }

  toModel() {
    let model = {
     id: this.id,
     email: this.email,
     password: this.password,
     code: this.code,
     active: this.active,
     firstName: this.firstName,
     lastName: this.lastName,
     gender: this.gender,
     avatar: this.avatar,
     birthday: this.birthday,
     nationality: this.nationality,
     roles: this.roles,
     tests: this.tests,
     createdAt: this.createdAt,
     updatedAt: this.updatedAt
    };
    model = _.omitBy(model, _.isNil);
    return model;
  }

  async create() {
    const user = this.toModel();
    console.log('User create', user);
    const params = {
      TableName: tableName,
      Item: user,
    };
    return dynamoDbLib.call('put', params);
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
        userId: this.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    updateItem.updatedAt = new Date().getTime();
    _.forEach(updateItem, (item, key) => {
      if (!['id', 'password', 'createdAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    const response = await dynamoDbLib.call('update', params);
    console.log('User update', response);
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
