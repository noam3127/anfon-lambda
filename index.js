'use strict';
const googleAuth = require('./lib/google-auth');
const db = require('./lib/dynamo-access');
const Promise = require('bluebird');
const _ = require('lodash');
const slackApi = require('./lib/slack-api');
const sayings = require('./lib/sayings');
const formatters = require('./lib/formatters');
const keywords = ['to', 'subject', 'body'];

const json = JSON.stringify;

function assembleBot(team, channel) {
  let bot = {
    team: team,
    api: slackApi(team)
  };

  bot.say = message => {
    if (typeof message === 'string') {
      return bot.api.send(channel, {text: message});
    } else {
      return bot.api.send(channel, message);
    }
  };

  for (let saying in sayings) {
    bot[saying] = bot.say.bind(bot, sayings[saying]);
  }
  return bot;
}

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
    }
  });
  console.log('paresemessage', body);
  return body;
}

/*function authorizeNewUser(userId, cb) {
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
}*/

const saveUserToken = Promise.coroutine(function* (event, code, bot, done) {
 try {
    let token = yield googleAuth.applyNewToken(code);
    const saveUser = Promise.promisify(db.saveUserToken, db);
    const user = yield saveUser(event.user_id, event.team_id, token);
    const text = sayings.authorized;
    if (event.command) {
      yield bot.api.commandResponse(sayings.authorized, event.response_url);
      return done(null, sayings.authorized);
    } else{
      yield bot.authorized();
    }
  } catch(e) {
    if (event.command) {
      yield bot.api.commandResponse(sayings.tokenCommandError, event.response_url);
    } else {
      yield bot.tokenError();
    }
  }
  return done();
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
      if (err) return reject(err); // don't reject
      if (!team || !team.Item) {
        console.log('TEAM NOT FOUND', team)
        return resolve(null);
      }
      return resolve(team.Item);
    });
  });
};

const handleNewUser = function(event, bot) {
  return new Promise(function(resolve, reject) {
    db.insertSlackUser(event.user_id, event.team_id, function(err) {
      if (err) {
        return reject(err);
      }
      const url = googleAuth.getAuthUrl();
      bot.introduce();
      bot.help();
      resolve();
    });
  });
}

// Lambda entry point
exports.handler = Promise.coroutine(function* (event, context, cb) {
  context.callbackWaitsForEmptyEventLoop = false;
  const done = () => {
    event = null;
    context = null;
    cb();
  };

  // transform event from API Gateway
  if (event['body-json']) {
    event = event['body-json'];
  }

  // Handle Slack's endpoint verification
  if (event.challenge) {
    console.log('recieved challenge', event);
    return done(null, {challenge: event.challenge});
  }

  if (event.type === 'event_callback') {
    let _event = event.event;
    delete event.event;
    _.assign(event, _event);
    event.user_id = event.user;
  }
  console.log('event post transformation:', event);

  let team = yield lookupTeam(event.team_id);
  if (!team) {
    return console.error('no team found for ', event.team_id);
  }

  // If this event was originated from us (the bot user), return
  if (event.user_id === team.bot_user_id) {
    return context.done();
  }
  let bot = assembleBot(team, event.channel);

  if (/^help/.test(event.text)) {
    yield bot.help();
    return done();
  } else if (/^instructions/.test(event.text)) {
    yield bot.instructions();
    return done();
  }

  let user = yield lookupUser(event.user_id, event.team_id);
  if (!user) {
    try {
      yield handleNewUser(event, bot);
    } catch(e) {
      console.error(e);
      yield bot.error();
    }
    return done();
  }

  let token, isSlashCommand;
  if (/^token=/.test(event.text)) {
    token = event.text.slice('token='.length).trim();
    return saveUserToken(event, token, bot, done);
  } else if (!token && event.command && event.command === '/anfon-token') {
    token = event.text;
    return saveUserToken(event, token, bot, done);
  }

  if (!user.googleAuth.access_token) {
    yield bot.unauthorized();
    return done();
  }

  const body = parseMessage(event.text.trim());
  if (!body.to) {
    return bot.missingTo().then(() => done());
  }

  if (!body.subject && !body.body) {
    yield bot.missingMessage();
    return done();
  }

  try {
    let resp = yield googleAuth.sendEmail(user.googleAuth, body);
  } catch(e) {
    console.error(e);
    yield bot.say(':slightly_frowning_face: There was a problem with sending that email:\n_' + e.errors[0].message + '_');
    return done();
  }
  yield bot.say(formatters.email(body));
  yield bot.sent();
  done();
});
