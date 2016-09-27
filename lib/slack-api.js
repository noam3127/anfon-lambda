'use strict';
const request = require('request-promise');
const qs = require('querystring');

module.exports = function(team) {
  console.log('config slackapi', team)
  const token = team.bot_access_token;
  const BASE = 'https://slack.com/api/';
  const messageUrl = BASE + 'chat.postMessage';

  return {
    send(channel, body) {
      Object.assign(body, {
        token: token,
        channel: channel, // DM channel for the user
        as_user: true
      });

      console.log('sending body...', body);
      return request.post(messageUrl).form(body).then(res => {
        console.log(res)
        return res;
      }).catch(e => console.log(e));
    }
  }
};
