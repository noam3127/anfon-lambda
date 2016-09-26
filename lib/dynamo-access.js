var AWS = require("aws-sdk");
// const dynamoose = require('dynamoose');
// var dynamoWrapper = require('dynamodb-data-types');
// var attr = dynamoWrapper.AttributeValue;
// var attrUpdate = dynamoWrapper.AttributeValueUpdate;

// AWS.config.update({
//   region: "us-west-2",
//   endpoint: "http://localhost:8008"
// });

const docClient = new AWS.DynamoDB.DocumentClient();
const userTable = 'SlackUsers';
const teamTable = 'SlackTeams';

exports.insertSlackUser = function(userId, teamId, cb) {
  const params = {
    TableName:userTable,
    Key: {
      id: {S: userId},
      teamId: {S: teamId},
    },
    Item:{
      id: userId,
      teamId: teamId,
      lastAccessed: new Date(),
      hasAuthorized: false,
      googleAuth: {
        access_token: null,
        refresh_token: null,
        expiry_date: 0,
        token_type: 'Bearer'
      },
      accessed: 0
    }
  };
  console.log("Adding a new item...", params);
  docClient.put(params, cb);
};

exports.getUser = function(userId, teamId, cb) {
  const params = {
    TableName: userTable,
    Key: { id: userId, teamId: teamId }
  };

  docClient.get(params, cb);
};

exports.saveUserToken = function(userId, teamId, auth, cb) {
  const update = 'SET googleAuth.access_token = :access_token, googleAuth.token_type = :token_type, ' +
    'googleAuth.refresh_token = :refresh_token, googleAuth.expiry_date = :expiry_date';
  // var dataUpdate = attrUpdate.put({googleAuth: auth});
  // console.log('dataUpdate', JSON.stringify(dataUpdate));
  const params = {
    TableName: userTable,
    Key: { id: userId, teamId: teamId },
    UpdateExpression: update,
    ExpressionAttributeValues: {
      ':access_token': auth.access_token,
      ':refresh_token': auth.refresh_token,
      ':expiry_date': auth.expiry_date,
      ':token_type': auth.token_type
    }
  };
  console.log('updating user...', params);
  docClient.update(params, cb);
};

exports.deleteUser = function(userId, teamId, cb) {
  const params = {
    TableName: userTable,
    Key: {id: userId, teamId: teamId}
  };

  docClient.delete(params, function(err, data) {
    console.log('deleted user', err, data);
    return cb(err, data);
  });

};
exports.getTeam = function(teamId, cb) {
  const params = {
    TableName: teamTable,
    Key: { id: teamId }
  };

  docClient.get(params, cb);

};
