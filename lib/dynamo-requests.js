const dynamoDbLib = require('./dynamodb-lib');

const getItemByGSIFull = ({
  TableName,
  IndexName,
  attribute,
  value,
  sortKey,
  sortValue,
  sortCondition = '=',
  rangeKey = 'updatedAt',
  rangeValue, // { "from": ..., "to": ... }
  filter,
  filterValue,
  fieldNotExists,
  LastEvaluatedKey,
  ScanIndexForward,
  Limit,
  returnAttributes,
}) => {
  const params = {
    TableName: `${TableName}`,
    KeyConditionExpression: '#attrKey = :attrValue',
    ExpressionAttributeValues: { ':attrValue': value },
    ExpressionAttributeNames: { '#attrKey': attribute },
  };
  returnAttributes ? params.ProjectionExpression = returnAttributes : '';
  IndexName ? params.IndexName = IndexName : '';
  LastEvaluatedKey ? params.ExclusiveStartKey = LastEvaluatedKey : '';
  ScanIndexForward ? params.ScanIndexForward = false : '';

  if (sortKey && sortValue) {
    params.KeyConditionExpression += ` and #sortKey ${sortCondition} :sortValue`;
    params.ExpressionAttributeNames['#sortKey'] = sortKey;
    params.ExpressionAttributeValues[':sortValue'] = sortValue;
  }
  Limit ? params.Limit = Limit : '';
  if (filter && filterValue) {
    params.FilterExpression = params.FilterExpression ? 
    params.FilterExpression += ` AND #${filter} = :${filter}` : `#${filter} = :${filter}`;
    params.ExpressionAttributeNames[`#${filter}`] = filter;
    params.ExpressionAttributeValues[`:${filter}`] = filterValue;
  }

  if (rangeKey, rangeValue) {
    params.KeyConditionExpression += ` and #${rangeKey} BETWEEN :from AND :to`;
    params.ExpressionAttributeNames[`#${rangeKey}`] = rangeKey;
    params.ExpressionAttributeValues[':from'] = rangeValue.from; 
    params.ExpressionAttributeValues[':to'] = rangeValue.to;
  }
  if (fieldNotExists) {
    params.FilterExpression = params.FilterExpression ? params.FilterExpression += ` AND attribute_not_exists(${fieldNotExists})` : `attribute_not_exists(${fieldNotExists})`;
  }
  return dynamoDbLib.call('query', params);
};

module.exports = {
  getItemByGSIFull,
}