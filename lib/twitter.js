const debug = require('debug')('twitter');
const Twitter = require('twitter');

const trends = require('../db/trends');

const twitter = {};

twitter.trendingClosest = user => new Promise((resolve, reject) => {
	const {latitude: lat, longitude: long} = user.latLng;

	const client = new Twitter({
		consumer_key: process.env.TV_TWITTER_APIKEY, // eslint-disable-line camelcase
		consumer_secret: process.env.TV_TWITTER_APISECRET, // eslint-disable-line camelcase
		access_token_key: user.oauthToken, // eslint-disable-line camelcase
		access_token_secret: user.oauthTokenSecret // eslint-disable-line camelcase
	});

	// Soooo only request trends if the timestamp is > 15 minutes ago
	// find existing trends for the current user
	trends.find(user).then(currTrends => {
		// Do we even have any trends for this user yet?
		// and are the existing trends older than ~ 30 seconds?
		if (!currTrends || (Date.now() - currTrends.timestamp) > 3e+4) {
			// Get new trends, save and return them
			client.get('trends/closest', {lat, long}, (err, loc) => {
				if (err) return reject(err); // eslint-disable-line curly

				client.get('trends/place', {id: loc[0].woeid}, (err, data) => {
					if (err) return reject(err); // eslint-disable-line curly

					// Save the trends to the database, associate with userid
					return trends.save(data[0].trends, user).then(resolve);
				});
			});
		}

		// Return the existing trends
		resolve(currTrends);
	}).catch(reject);
});

module.exports = twitter;
