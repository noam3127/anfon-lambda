'use strict';
const googleAuthUrl = require('./google-auth').getAuthUrl();

const introduce = ':smiley:\nHi! I\'m Anfon, a bot that will allow you to easily send email straight from Slack!';

const instructions = 'To send an email, all you need to do is send me direct message and specify `to:`, `subject:`, and `body:`. Like this:\n' +
  '```to: joe@example.com \nsubject: Hi Joe \nbody: I\'m emailing you straight from Slack!```'+
  '\n\n Type `instructions` at any time to see this message again.';

const help = 'First, you need to authorize this app to send email with your Gmail account by <' + googleAuthUrl + ' | clicking on this link>.\n' +
    'Then copy the token from that page and type the following slash command: ```/anfon-token {paste your token here}``` \n\n'+ instructions;

const authorized = ':thumbsup: You\'re all set. Go ahead and send some email! For instructions, type `instructions`.';

const unauthorized = 'Sorry, it appears I\'m not authorized to connect to send emails on your behalf. Please <' + googleAuthUrl + ' | click on this link>,'+
 '\nthen type the following slash command: ```/anfon-token {paste your token here}```';

const error = ':confused: An error occurred. Please try again. If this keeps happening, try reauthorizing me. Type `help` for more info';

const sent = ':email: Your email has been sent!';

const missingTo = ':slightly_frowning_face: Sorry, I couldn\'t send that email because it\'s missing a recipient. '+
  'You can specify the recipient by typing `to:joe@example.com` in the chat message.';

const missingMessage = ':slightly_frowning_face: I couldn\'t send that email because it didn\'t include a subject or body. Define the subject by typing '+
 '`subject:Here is the email subject` and the email body by typing `body:This is the main body of the email.`';

const tokenError = 'There was a problem with that token. Please try again, or type `help` for more info';

const tokenCommandError = 'There was a problem with that token. Please try again, or ask @anfon for `help` in a direct message for more info.';

module.exports = {
  introduce: introduce,
  help: help,
  authorized: authorized,
  unauthorized: unauthorized,
  instructions: instructions,
  error: error,
  sent: sent,
  missingTo: missingTo,
  missingMessage: missingMessage,
  tokenError: tokenError,
  tokenCommandError: tokenCommandError
};
