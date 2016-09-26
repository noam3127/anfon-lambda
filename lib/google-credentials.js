module.exports = {
  "installed":{
    "client_id":process.env.GOOGLE_CLIENT_ID,
    "client_secret": process.env.GOOGLE_CLIENT_SECRET,
    "project_id": process.env.GOOGLE_PROJECT_ID,
    "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    "token_uri":"https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    "redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost","https://vejkmdramj.execute-api.us-west-2.amazonaws.com/development"]
  }
}
