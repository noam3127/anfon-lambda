'use strict';
const googleAuth = require('./lib/google-auth');
const db = require('./lib/dynamo-access');
const Promise = require('bluebird');
const _ = require('lodash');
const slackApi = require('./lib/slack-api');
const sayings = require('./lib/sayings');

const keywords = ['to', 'subject', 'body'];
const json = JSON.stringify;

function checkKeywords(word) {
  let regex;
  for (let j = 0; j < keywords.length; j++) {
    regex = new RegExp(`^${keywords[j]}:`);
    if (regex.test(word)) {
     return keywords[j];
    }
  }
  return null;
}

function parseMessage(text) {
  const arr = text.split(' ').filter(word => word !== ' ');
  const body = {};
  var currentSet = null;
  arr.forEach(word => {
    let key = checkKeywords(word);
    if (key) {
      body[key] = word.slice(key.length + 1);
      currentSet = key;
    } else if (currentSet) {
      body[currentSet] += ' ' + word;
      console.log(currentSet);
    }
  });
  return body;
}

function authorizeNewUser(userId, cb) {
  googleAuth.authorizeUser(function(err, auth) {
    if (err) return cb(err);
    const userData = {
      id: userId,
      dateAccessed: new Date(),
      googleAuth: auth,
      accessed: 100
    };

    console.log('inserting new user');
    db.insertSlackUser(userData, function(err, data) {
       db.getUser(userId, cb);
    });
  });
}

// function authorizeUser(userId, cb) {
//   if (!userId) {
//     return cb('No user_id');
//   }
//   db.getUser(userId, function(err, user) {
//     if (err) return cb(err);
//     if (!user || !user.Item) {
//       console.log('USER NOT FOUND', user)
//       return authorizeNewUser(userId, cb);
//     }
//     return cb(null, user.Item)
//   });
// }

const saveUserToken = Promise.coroutine(function* (event, bot) {
  let token;
  try {
    let code = event.text.slice('token='.length).trim();
    token = yield googleAuth.applyNewToken(code);
    console.log('save new token', token);
    const saveUser = Promise.promisify(db.saveUserToken, db);
    const user = yield saveUser(event.user_id, event.team_id, token);
    bot.savedToken();
  } catch(e) {
    console.error('error saving token', e);
    bot.error();
  }



});

const lookupUser = function(userId, teamId) {
  return new Promise(function(resolve, reject) {
    db.getUser(userId, teamId, function(err, user) {
      if (err) return reject(err);
      if (!user || !user.Item) {
        console.log('USER NOT FOUND', user)
        return resolve(null);
      }
      return resolve(user.Item);
    });
  });
};

const lookupTeam = function(teamId) {
  return new Promise(function(resolve, reject) {
    db.getTeam(teamId, function(err, team) {
      if (err) return reject(err);
      if (!team || !team.Item) {
        console.log('TEAM NOT FOUND', team)
        return resolve(null);
      }
      return resolve(team.Item);
    });
  });
};

const handleNewUser = function(event, bot) {
  db.insertSlackUser(event.user_id, event.team_id, function(err) {
    if (err) {
      console.error(err);
      return bot.error();
    }
    const url = googleAuth.getAuthUrl();
    console.log('Welcome! In order to start sending email, you first need to authorize me by visiting this URL:\n' +url);
    console.log('\n Then type the following: "token=<the-secret-code>" (replacing <the-secret-code> with the code you copied from that URL).');
    bot.introduce();
    bot.help();
  });
}


exports.handler = Promise.coroutine(function* (event, context) {
  let bot = {};
  // transform event from API Gateway
  if (event['body-json']) {
    event = event['body-json'];
  }

  // Handle Slack's endpoint verification
  if (event.challenge) {
    console.log('recieved challenge', event);
    return context.done(null, {challenge: event.challenge});
  }

  // process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

  // Respond immediately to a request sent from a slack event.
  // Any messages from our bot will be sent via slack's 'chat.sendMessage' api
  context.done();

  if (event.type === 'event_callback') {
    let _event = event.event;
    delete event.event;
    _.assign(event, _event);
    event.user_id = event.user;
    console.log('event after transformation', event);
  }


  let team = yield lookupTeam(event.team_id);
  if (!team) {
    return console.error('no team found for ', event.team_id);
  }

  bot.team = team;
  bot.api = slackApi(team);
  bot.say = function(message) {
    if (typeof message === 'string') {
      bot.api.send(event.channel, {text: message});
    } else {
      bot.api.send(event.channel, message);
    }
  };

  for (let saying in sayings) {
    bot[saying] = bot.say.bind(bot, sayings[saying]);
  }

  let user = yield lookupUser(event.user_id, event.team_id);
  if (!user) {
    return handleNewUser(event);
  }

  if (/^token=/.test(event.text)) {
    return saveUserToken(event, bot);
  }

  if (!user.googleAuth.access_token) {
    return bot.unauthorized();
  }

  const body = parseMessage(event.text.trim());
  if (!body.to) {
    return bot.missingTo();
  }

  if (!body.subject && !body.body) {
    return bot.missingMessage();
  }

  try {
    let resp = yield googleAuth.sendEmail(user.googleAuth, body);
    bot.sent();
  } catch(e) {
    console.error(e);
    bot.error();
  }

});
