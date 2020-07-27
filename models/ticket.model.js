const dynamoDbLib = require('../lib/dynamodb-lib');
// const { getItemByGSIFull } = require('../lib/dynamo-requests');
const _ = require('lodash');
const uuid = require('uuid').v4;
const { uploadImage } = require('../helpers/uploads');

const table = 'supportTickets-dev';

const TICKET_STATUS = Object.freeze({
  PENDING: 'pending',
  CLOSED: 'closed'
});

class SupportTicket {
  constructor(obj) {
    this.id = obj.id;
    this.userId = obj.userId;
    this.type = obj.type; // package or test
    this.status = obj.status;
    this.image= obj.image;
    this.text = obj.text;
    this.response = obj.response;
    this.updatedAt = obj.updatedAt;
    this.createdAt = obj.createdAt || Date.now();
  }

  toModel() {
    let model = {
      id: this.id,
      userId: this.userId,
      type: this.type,
      status: this.status,
      text: this.text,
      image: this.image,
      response: this.response,
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
}

module.exports = {
  SupportTicket
};
