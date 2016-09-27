'use strict';
const PRIMARY_COLOR = '#6de72a';

module.exports = {
  email: function(body, username) {
    const message = {
      attachments: JSON.stringify([{
        title: 'To: ' +body.to +'\nSubject: ' + body.subject,
        text: body.body,
        fallback: body.subject,
        color: PRIMARY_COLOR,
        author_name: username
      }])
    };
    return message;
  }
}
