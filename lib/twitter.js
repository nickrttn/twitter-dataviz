const debug = require('debug')('twitter');
const Twitter = require('twitter');

const trends = require('../db/trends');

const twitter = {};

twitter.trendingClosest = user => new Promise((resolve, reject) => {
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
			if (user.latLng === 'world') {
				client.get('trends/place', {id: 1}, (err, data) => {
					if (err) return reject(err); // eslint-disable-line curly
					return trends.save(data[0].trends, user).then(resolve).catch(reject);
				});
			}

			client.get('trends/closest', {lat: user.latLng.latitude, long: user.latLng.longitude}, (err, loc) => {
				if (err) return reject(err); // eslint-disable-line curly

				client.get('trends/place', {id: loc[0].woeid}, (err, data) => {
					if (err) return reject(err); // eslint-disable-line curly

					// Save the trends to the database, associate with userid
					return trends.save(data[0].trends, user).then(resolve).catch(reject);
				});
			});
		}

		// Return the existing trends
		resolve(currTrends);
	}).catch(reject);
});

module.exports = twitter;
