'use strict';
const googleAuthUrl = require('./google-auth').getAuthUrl();

const introduce = ':smiley:\nHi! I\'m Anfon, a bot that will allow you to easily send email straight from Slack!';

const instructions = 'To send an email, all you need to do is send me direct message and specify `to: `, `subject:`, and `body:`. Like this:\n' +
  '```to:joe@example.com subject:Hi Joe body:I\'m emailing you straight from Slack!```'+
  '\n\n Type `instructions` at any time to see this message again.';

const help = 'First, you need to authorize this app to send email with your Gmail account by <' + googleAuthUrl + ' | clicking on this link>.\n' +
    'Then copy the token from that page and paste it here like so: ```token=<gmail auth token>``` (replacing <gmail auth token> with your token).\n\n'+ instructions;
const authorized = ':thumbsup: You\'re all set. Go ahead and send some email! For instructions, type `instructions`.';

const unauthorized = 'Sorry, it appears I\'m not authorized to connect to send emails on your behalf. Please <' + googleAuthUrl + ' | click on this link>,'+
 '\nthen paste the given token here by typing ```token=<gmail auth token>```';

const error = ':confused: An error occurred. Please try again. If this keeps happening, try reauthorizing me. Type `help` for more info';

const sent = ':email: Your email has been sent!';

const missingTo = ':slightly_frowning_face: Sorry, I couldn\'t send that email because it\'s missing a recipient. '+
  'You can specify the recipient by typing `to:joe@example.com` in the chat message.';

const missingMessage = ':slightly_frowning_face: I couldn\'t send that email because it didn\'t include a subject or body. Define the subject by typing '+
 '`subject:Here is the email subject` and the email body by typing `body:This is the main body of the email.`';


module.exports = {
  introduce: introduce,
  help: help,
  authorized: authorized,
  unauthorized: unauthorized,
  instructions: instructions,
  error: error,
  sent: sent,
  missingTo: missingTo,
  missingMessage: missingMessage
};
