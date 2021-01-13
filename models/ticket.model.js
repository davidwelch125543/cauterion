const dynamoDbLib = require('../lib/dynamodb-lib');
const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;
const { uploadFileInS3 } = require('../helpers/uploads');
const { USER_TYPES } = require('./user.model');

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
		this.files = obj.files;
		this.seen = obj.seen;
    this.createdAt = obj.createdAt
  }

  toModel() {
    if (!this.text && !this.files) throw new Error('Message content is empty');
    let model = {
      id: this.id || uuid(),
      text: this.text,
			owner: this.owner,
			files: this.files,
			seen: this.seen || 0,
      createdAt: this.createdAt || Date.now()
    };
    return model;
  }
}

class SupportTicket {
  constructor(obj) {
    this.id = obj.id;
    this.userId = obj.userId;
		this.userId_status = obj.userId_status;
		this.operator_status = obj.operator_status;
		this.provider = obj.provider || 'cauterion';
		this.operator = obj.operator;
    this.type = obj.type; // package or test
    this.status = obj.status;
    this.image= obj.image;
    this.title = obj.title;
    this.text = obj.text;
    this.messages = obj.messages; // Support ticket messages bitween operator & user
    this.updatedAt = obj.updatedAt;
    this.createdAt = obj.createdAt || Date.now();
  }

  toModel() {
    let model = {
      id: this.id,
      userId: this.userId,
			userId_status: this.userId_status,
			operator_status: this.operator_status,
			provider: this.provider,
			operator: this.operator,
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
    const supportTicketImage = this.image ? (await uploadFileInS3(this.userId, this.image, 'support')).url : null;
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

  static async getSupportTickets(data, user) {
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
    } else if (user.type === USER_TYPES.ADMIN) {
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
    } else if (user.type === USER_TYPES.OPERATOR) {
			const items = (await getItemByGSIFull({
        TableName: table,
        IndexName: data.status ? 'operator_status-updatedAt-index' : 'status-updatedAt-index',
        attribute: data.status ? 'operator_status': 'status',
        value: data.status ? `${user.id}#${data.status}`: TICKET_STATUS.PENDING,
        LastEvaluatedKey: data.LastEvaluatedKey || null,
        ScanIndexForward: data.ScanIndexForward || true, // default => newest
        Limit: data.limit || 20
      }));
      response = items;
		}
    return response;
	}
	static async getSupportTicketsByOperator(data, operatorId) {
		const items = (await getItemByGSIFull({
			TableName: table,
			IndexName: data.status ? 'operator_status-updatedAt-index' : 'operator-updatedAt-index',
			attribute: data.status ? 'operator_status': 'operator',
			value: data.status ? `${operatorId}#${data.status}`: operatorId,
			LastEvaluatedKey: data.LastEvaluatedKey || null,
			ScanIndexForward: data.ScanIndexForward || true, // default => newest
			Limit: data.limit || 20
		}));
		return items;
  }

  static async update(supportTicketId, userId, updatedData, userType) {
    const ticket = (await SupportTicket.getById(supportTicketId)).Items[0];
    if (!ticket) throw new Error('Ticket doesn\'t exist');

    if (![USER_TYPES.ADMIN, USER_TYPES.OPERATOR].includes(userType) && ticket.userId !== userId) throw new Error('Access denied');

    if (updatedData && updatedData.message) {
			// Uploaded files limit (2)
			if (Array.isArray(updatedData.message.files)) {
				const filesOtd = [];
				if (updatedData.message.files.length > 2) throw new Error('Upload limit is 2.');
				for (const attachedFile of updatedData.message.files) {
					const data = await uploadFileInS3(`${userId}_${userType}`, attachedFile.content, 'support', 'all');
					filesOtd.push(data);
				}
				updatedData.message.files = filesOtd;
			}
      const message = (new SupportMessage({ owner: userType, ...updatedData.message })).toModel();
			ticket.messages.push(message);
			if ([USER_TYPES.ADMIN, USER_TYPES.OPERATOR].includes(userType)) {
				ticket.status = TICKET_STATUS.REPLIED;
				ticket.operator = userId;
				ticket.operator_status = `${userId}#${TICKET_STATUS.REPLIED}`;
			} else {
				ticket.status = TICKET_STATUS.PENDING;
			}
		}
		
    if (updatedData.status && updatedData.status === TICKET_STATUS.CLOSED) ticket.status = TICKET_STATUS.CLOSED;
		
		if (userType === USER_TYPES.USER) {
			ticket.userId_status = `${userId}#${ticket.status}`;
		}
		
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
		
		ticket.updatedAt = new Date().getTime();
    _.forEach(ticket, (item, key) => {
      if (!['id', 'userId', 'title', 'text', 'image', 'provider'].includes(key)) {
				const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
			};
		});
    await dynamoDbLib.call('update', params);
    return ticket;
	}
	
	static async messageSeen(user, ticketId) {
		const ticket = (await SupportTicket.getById(ticketId)).Items[0];
    if (!ticket) throw new Error('Ticket doesn\'t exist');
		
		if ((user.type === USER_TYPES.OPERATOR && user.id !== ticket.operator) || (user.type === USER_TYPES.USER && user.id !== ticket.userId)) throw new Error('Access denied');
		
		ticket.messages = ticket.messages.map(msg => {
			if ((user.type === USER_TYPES.OPERATOR && msg.owner === USER_TYPES.USER) || (user.type === USER_TYPES.USER && msg.owner === USER_TYPES.OPERATOR)) msg.seen = 1;
			return msg;
		});

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

		ticket.updatedAt = new Date().getTime();
    _.forEach(ticket, (item, key) => {
      if (['messages', 'updatedAt'].includes(key)) {
        const beginningParam = params.UpdateExpression ? `${params.UpdateExpression}, ` : 'SET ';
        params.UpdateExpression = beginningParam + '#' + key + ' = :' + key;
        params.ExpressionAttributeNames['#' + key] = key;
        params.ExpressionAttributeValues[':' + key] = item;
      }
    });
    await dynamoDbLib.call('update', params);
	}
};

module.exports = {
	SupportTicket,
	TICKET_STATUS,
};
