'use strict';
const googleAuthUrl = require('./google-auth').getAuthUrl();

const introduce = ':smiley:\nHi! I\'m Anfon, a bot that will allow you to easily send email straight from Slack!';

const instructions =  'To send an email out, all you need to do is send me direct message and specify `to:... `, `subject:...` ,and `body:...`. Like this:\n' +
  '*to:john@example.com subject:Hi John body:I am sending you this email straight from Slack.*'+
  '\n\n Type `help` at any time to see this message again.';

const help = 'First, you need to authorize this app to send email with your Gmail account by visiting this url:\n '+ googleAuthUrl +
  '\n\n Then paste the given token by typing `token=<gmail_auth_token>`.\n\n'+ instructions;

const authorized = ':thumbsup: You\'re all set. Go ahead and send some email! For instructions, type `instructions`.';

const unauthorized = 'Sorry, it appears I\'m not authorized to connect to send emails on your behalf. Please visit the following URL:\n' + googleAuthUrl +
 '\n\n Then paste the given token here by typing `token=<gmail_auth_token>`';

const error = ':confused: An error occurred. Please try again. In case this keeps happening, try reauthorizing me. Type `help` for more info';

const sent = 'Sent email!';

const missingTo = ':( Sorry, I could\'nt send that email because it\'s missing a recipient. '+
  'You can specify the recipient by typing `to:joh@example.com` in the chat message.';

module.exports = {
  introduce: introduce,
  help: help,
  authorized: authorized,
  unauthorized: unauthorized,
  instructions: instructions,
  error: error,
  sent: sent,
  missingTo: missingTo,
};
