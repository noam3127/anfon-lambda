'use strict';
const request = require('request-promise');
const json = JSON.stringify;
const qs = require('querystring');
//   var body = {
//     text: 'heelo!',
//     token: slackData.bot.bot_access_token,
//     channel: req.body.event.channel,
//     as_user: true
//   };

//   const url= `https://slack.com/api/chat.postMessage?${qs.stringify(body)}`
//     // 'Content-type': 'application/json',
//   const params= qs.stringify(body)
//     // body: JSON.stringify(body)
//   handler(req.body, context)
//   return request(url).then(resp => console.log(resp)).catch(e => console.log(e));
//   // request.post(data);
// });


module.exports = function(team) {
  console.log('config slackapi', team)
  const token = team.bot_access_token;
  const BASE = 'https://slack.com/api/';
  const messageUrl = BASE + 'chat.postMessage';
  console.log(token)

  // const messageRequest = (body) => {
  //   return {
  //     uri: messageUrl,
  //     auth: {bearer: token},
  //     headers: {
  //       'Content-Type': 'application/json'
  //     }
  //   }
  // };
  return {
    send(channel, body) {
      Object.assign(body, {
        token: token,
        channel: channel, // DM channel for the user
        as_user: true
      });

      console.log('sending body...', body);
      return request.post(messageUrl).form(body).then(res => {
        console.log('sent message', res);
      }).catch(e => console.log(e));
    }
  }
};
