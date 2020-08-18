const dynamoDbLib = require('../lib/dynamodb-lib');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;
const { uploadImage } = require('../helpers/uploads');

const table = 'supportTickets-dev';

const TICKET_STATUS = Object.freeze({
  PENDING: 'pending',
  REPLIED: 'replied',
  CLOSED: 'closed'
});

class SupportMessage {
  constructor(obj) {
    this.id = obj.id;
    this.text = obj.text;
    this.owner = obj.owner;
    this.createdAt = obj.createdAt
  }

  toModel() {
    if (!this.text) throw new Error('Message text is empty');
    let model = {
      id: this.id || uuid(),
      text: this.text,
      owner: this.owner,
      createdAt: this.createdAt || Date.now()
    }
    return model;
  }
}

class SupportTicket {
  constructor(obj) {
    this.id = obj.id;
    this.userId = obj.userId;
    this.userId_status = obj.userId_status;
    this.provider = obj.provider || 'cauterion';
    this.type = obj.type; // package or test
    this.status = obj.status;
    this.image= obj.image;
    this.title = obj.title;
    this.text = obj.text;
    this.messages = obj.messages; // Support ticket messages bitween support & user
    this.updatedAt = obj.updatedAt;
    this.createdAt = obj.createdAt || Date.now();
  }

  toModel() {
    let model = {
      id: this.id,
      userId: this.userId,
      userId_status: this.userId_status,
      provider: this.provider,
      type: this.type,
      status: this.status,
      title: this.title,
      text: this.text,
      messages: this.messages || [],
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
    this.status = TICKET_STATUS.PENDING;
    this.userId_status = `${this.userId}#${this.status}`;
    const supportTicketImage = this.image ? (await uploadImage(this.userId, this.image, 'support')).Location : null;
    if (supportTicketImage) {
      this.image = supportTicketImage;
    }
    const ticket = this.toModel();
    const params = {
      TableName: table,
      Item: ticket,
    };
    return dynamoDbLib.call('put', params);
  }

  static async getById(ticketId) {
    const params = {
      TableName: table,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': ticketId,
      },
    };
    return dynamoDbLib.call('query', params);
  }

  static async getSupportTickets(data) {
    let response = {};
    if (data.userId) { // For Users 
      const items = (await getItemByGSIFull({
        TableName: table,
        IndexName: data.status ? 'userId_status-updatedAt-index' : 'userId-updatedAt-index',
        attribute: data.status ? 'userId_status': 'userId',
        value: data.status ? `${data.userId}#${data.status}` : data.userId,
        rangeValue: data.range || null,
        LastEvaluatedKey: data.LastEvaluatedKey || null,
        ScanIndexForward: data.ScanIndexForward || true, // default => newest
        Limit: data.limit || 20
      }));
      response = items;
    } else { // For Admin
      const items = (await getItemByGSIFull({
        TableName: table,
        IndexName: data.status ? 'status-updatedAt-index' : 'provider-updatedAt-index',
        attribute: data.status ? 'status': 'provider',
        value: data.status || 'cauterion',
        LastEvaluatedKey: data.LastEvaluatedKey || null,
        ScanIndexForward: data.ScanIndexForward || true, // default => newest
        Limit: data.limit || 20
      }));
      response = items;
    }
    return response;
  }

  static async update(supportTicketId, userId, updatedData, userType) {
    const ticket = (await SupportTicket.getById(supportTicketId)).Items[0];
    if (!ticket) throw new Error('Ticket doesn\'t exist');

    if (userType !== 'admin' && ticket.userId !== userId) throw new Error('Access denied');

    if (updatedData && updatedData.message) {
      const message = (new SupportMessage({ owner: userType, ...updatedData.message })).toModel();
      ticket.messages.push(message);
      ticket.status = userType === 'admin' ? TICKET_STATUS.REPLIED : TICKET_STATUS.PENDING;
    }
    if (updatedData.status && updatedData.status === TICKET_STATUS.CLOSED) ticket.status = TICKET_STATUS.CLOSED;
    
    const params = {
      TableName: table,
      Key: {
        id: ticket.id,
      },
      ExpressionAttributeValues: {
      },
      ExpressionAttributeNames: {
      },
      ReturnValues: 'ALL_NEW',
    };
    
    ticket.userId_status = `${ticket.userId}#${ticket.status}`;
    ticket.updatedAt = new Date().getTime();
    _.forEach(ticket, (item, key) => {
      if (!['id', 'userId', 'title', 'text', 'image', 'provider'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    await dynamoDbLib.call('update', params);
    return ticket;
  }
}

module.exports = {
  SupportTicket
};
