'use strict';
const PRIMARY_COLOR = '#6de72a';

module.exports = {
  email: function(body, username) {
    let title = 'To: ' + body.to;
    if (body.subject) title += '\nSubject: ' + body.subject;
    const message = {
      attachments: JSON.stringify([{
        title: title,
        text: body.body,
        fallback: body.subject,
        color: PRIMARY_COLOR,
        author_name: username
      }])
    };
    return message;
  }
}
