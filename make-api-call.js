const request = require('request-promise');
const debug = require('debug')('hack-night-form-fill:make-api-call');
const {
  UNAUTHORIZED,
} = require('http-status-codes');
const Config = require('./config');

async function getCredentials() {
  if (!process.env.MEETUP_TEMPACCESSTOKEN || !process.env.MEETUP_REFRESHTOKEN) {
    throw new Error(`No available credentials; go to ${Config.baseUrl}/auth and set as constants from log`);
  }
  const credentialsJSON = {
    'access_token': process.env.MEETUP_TEMPACCESSTOKEN,
    'refresh_token': process.env.MEETUP_REFRESHTOKEN,
  };
  return credentialsJSON;
}

async function requestCredentials(req) {
  debug('Requesting credentials');
  const response = await request({
    uri: 'https://secure.meetup.com/oauth2/access',
    method: 'post',
    qs: {
      client_id: process.env.MEETUP_CLIENT_ID,
      client_secret: process.env.MEETUP_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${Config.baseUrl}/auth/callback`,
      code: req.query.code,
    },
    json: true,
  });

  const { error, ...credentials } = response;

  console.log(credentials);
  if (error) {
    throw new Error(error);
  }

  debug('Fetched credentials');

  return credentials;
}

async function refreshCredentials({refresh_token}) {
  debug('Refreshing credentials');
  try {
    const response = await request({
      uri: 'https://secure.meetup.com/oauth2/access',
      method: 'post',
      qs: {
        client_id: Config.meetup.clientId,
        client_secret: Config.meetup.clientSecret,
        grant_type: 'refresh_token',
        refresh_token,
      },
      json: true,
    });

    const { error, ...credentials } = response;

    if (error) {
      throw new Error(error);
    }

    debug('Refreshed credentials for this session')

    return credentials;
  }
  catch (ex) {
    throw new Error(`Error refreshing access token; try going to ${Config.baseUrl}/auth to get a new auth token (error: ${ex.message})`);
  }
}

async function callAPIMethod({
  apiPath,
  qs,
  ...requestArgs
}) {
  let credentials = await getCredentials()

  const getResponse = async () => {
    return request({
      uri: `https://api.meetup.com/Code-for-Boston/${apiPath}`,
      qs,
      headers: {
        Authentication: `Bearer: ${credentials.access_token}`,
      },
      ...requestArgs,
    });
  };

  let response = getResponse();

  if (response.statusCode === UNAUTHORIZED) {
    // Try refreshing credentials, then try the request again
    credentials = await refreshCredentials(credentials);
    response = await getResponse();
  }

  return response;
}

module.exports = {
  callAPIMethod,
  requestCredentials,
};
