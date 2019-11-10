require('dotenv').config()
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || '3000';
const externalPort = process.env.EXTERNAL_PORT || port;

/* We may have to use unsecure http because that is registered with meetup */
const config = {
  host,
  port,
  externalPort,
  baseUrl: `http://${host}:${externalPort}`,
    meetup: {
    clientId: process.env.MEETUP_CLIENT_ID,
    clientSecret: process.env.MEETUP_CLIENT_SECRET,
  },
};

module.exports = config;
