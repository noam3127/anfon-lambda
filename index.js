'use strict';
const googleAuth = require('./google-auth');
const db = require('./dynamo-access');
const Promise = require('bluebird');

const keywords = ['to', 'from', 'subject', 'body', 'message'];

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

const saveUserToken = Promise.coroutine(function* (event, context) {
  let token;
  try {
    let code = event.text.slice('token='.length).trim();
    token = yield googleAuth.applyNewToken(code);
    const saveUser = Promise.promisify(db.saveUserToken, db);
    const user = yield saveUser(event.user_id, event.team_id, token);
  } catch(e) {
    console.error(e);
    context.fail();
  }

  context.succeed();

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

const handleNewUser = function(event, context) {
  db.insertSlackUser(event.user_id, event.team_id, function(err) {
    if (err) {
      console.error(err)
      return context.fail();
    }
    const url = googleAuth.getAuthUrl();
    console.log('Welcome! In order to start sending email, you first need to authorize me by visiting this URL:\n' +url);
    console.log('\n Then type the following: "token=<the-secret-code>" (replacing <the-secret-code> with the code you copied from that URL).');
    return context.succeed();
  });
}


exports.handler = Promise.coroutine(function* (event, context) {
  let user = yield lookupUser(event.user_id, event.team_id)
  if (!user) {
    return handleNewUser(event, context);
  }
  if (/^token=/.test(event.text)) {
    return saveUserToken(event, context);
  }

  const body = parseMessage(event.text.trim());
  if (!body.to) {
    context.fail()
  }
  let resp = yield googleAuth.sendEmail(user.googleAuth, body);
});
