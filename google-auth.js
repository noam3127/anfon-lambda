// const fs = require('fs');
// const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const credentials = require('./google-credentials');
const Promise = require('bluebird');

const clientSecret = credentials.installed.client_secret;
const clientId = credentials.installed.client_id;
const redirectUrl = credentials.installed.redirect_uris[0];

const TOKEN_DIR = __dirname + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'gmail-token.json';

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
  console.log('Authorize this app by visiting this url: ', authUrl);
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
  return getOAuthClient().getTokenAsync(code).spread(token => token);
};

exports.authorizeUser = authorizeUser;


function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
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
exports.getAuthUrl = function() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  return authUrl;
};

// var body =  'Content-length: 5000\n' +
//           'Content-Transfer-Encoding: message/rfc2822\n' +
//           'to: nlustiger@monimus.net\n' +
//           // 'from: \'test\' <test@gmail.com>\n' +
//           'subject: Hello world\n\n' +

//           'The actual message text goes here';
            // ).replace(/\+/g, '-').replace(/\//g, '_');

function buildMessage(data) {
  return 'Content-length: 5000\n' +
    'Content-Transfer-Encoding: message/rfc2822\n' +
    `to:${data.to}\nsubject:${data.subject}\n\n` +
    data.body;
}

function sendEmail(credentials, data) {
  return new Promise(function(resolve, reject) {
    const str = buildMessage(data);
    const oauth2Client = getOAuthClient(credentials);
    const message = new Buffer(str).toString('base64');
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
