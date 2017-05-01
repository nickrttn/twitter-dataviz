const Twitter = require('twitter');

module.exports = session => {
	const client = new Twitter({
		consumer_key: process.env.TV_TWITTER_APIKEY, // eslint-disable-line camelcase
		consumer_secret: process.env.TV_TWITTER_APISECRET, // eslint-disable-line camelcase
		access_token_key: session.oauthToken, // eslint-disable-line camelcase
		access_token_secret: session.oauthTokenSecret // eslint-disable-line camelcase
	});

	return client.stream('statuses/sample');
}
