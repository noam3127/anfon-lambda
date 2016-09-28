// const fs = require('fs');
// const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const credentials = require('./google-credentials');
const Promise = require('bluebird');
const base64url = require('base64url');

const clientSecret = credentials.installed.client_secret;
const clientId = credentials.installed.client_id;
const redirectUrl = credentials.installed.redirect_uris[0];

const SCOPES = ['https://www.googleapis.com/auth/gmail.compose'];

function getOAuthClient(credentials) {
  const auth = new googleAuth();
  const client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  Promise.promisifyAll(client);
  if (credentials) {
    client.credentials = credentials;
  }
  return client;
}

exports.getOAuthClient = getOAuthClient;

function authorizeUser(callback) {
  const oauth2Client = getOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return callback(err);
      }
      oauth2Client.credentials = token;
        callback(null, oauth2Client);
    });
  });

}
exports.applyNewToken = function(code) {
  return getOAuthClient().getTokenAsync(code);
};

exports.authorizeUser = authorizeUser;

exports.getAuthUrl = function() {
  const authUrl = getOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  return authUrl;
};

function getUserInfo(token) {

}

function buildMessage(data) {
  return 'Content-length: 5000\n' +
    'Content-Transfer-Encoding: message/rfc2822\n' +
    `to:${data.to}\nsubject:${data.subject || ''}\n\n` +
    (data.body || '');
}

function sendEmail(credentials, data) {
  return new Promise(function(resolve, reject) {
    if (!credentials.access_token) {
      return reject('invalid access_token');
    }
    const str = buildMessage(data);
    const oauth2Client = getOAuthClient(credentials);
    const message = base64url.encode(str);
    const gmail = google.gmail('v1');
    gmail.users.messages.send({
      auth: oauth2Client,
      userId: 'me',
      resource: {
        raw: message
      }
    }, function(err, response) {
      if (err) {
        console.log('The Google API returned an error: ' + err);
        return reject(err);
      }
      resolve(response.body);
    });
  });
}

exports.sendEmail = sendEmail;
