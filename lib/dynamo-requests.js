const dynamoDbLib = require('./dynamodb-lib');

const getItemByGSIFull = ({
  TableName,
  IndexName,
  attribute,
  value,
  sortKey,
  sortValue,
  sortCondition = '=',
  filter,
  filterValue,
  filter1,
  filterValue1,
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

  if (filter1 && filterValue1) {
    params.FilterExpression = params.FilterExpression ? params.FilterExpression += ` AND #${filter1} = :${filter1}` : `#${filter1} = :${filter1}`;
    params.ExpressionAttributeNames[`#${filter1}`] = filter1;
    params.ExpressionAttributeValues[`:${filter1}`] = filterValue1;
  }
  if (fieldNotExists) {
    params.FilterExpression = params.FilterExpression ? params.FilterExpression += ` AND attribute_not_exists(${fieldNotExists})` : `attribute_not_exists(${fieldNotExists})`;
  }
  return dynamoDbLib.call('query', params);
};

module.exports = {
  getItemByGSIFull,
}