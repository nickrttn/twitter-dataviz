/* eslint camelcase: 0 */
const debug = require('debug')('user');
const Twitter = require('twitter');

const connect = require('./connect');

const user = {};

user.save = session => new Promise((resolve, reject) => {
	const client = new Twitter({
		consumer_key: process.env.TV_TWITTER_APIKEY,
		consumer_secret: process.env.TV_TWITTER_APISECRET,
		access_token_key: session.oauthToken,
		access_token_secret: session.oauthTokenSecret
	});

	console.log(session);

	client.get('account/verify_credentials', {
		include_entities: false,
		skip_status: true,
		include_email: false
	}, (err, res) => {
		if (err) {
			session.errors = res.errors;
			reject(err);
		}

		console.log(err, res);

		connect.then(db => {
			db.collection('users')
				.findOneAndUpdate({_id: res.id}, {$set: Object.assign({
					oauthToken: session.oauthToken,
					oauthTokenSecret: session.oauthTokenSecret
				}, res)}, {upsert: true, returnOriginal: false})
				.then(resolve).catch(reject);
		}).catch(reject);
	});
});

user.location = session => new Promise((resolve, reject) => {
	connect.then(db => {
		db.collection('users')
			.findOneAndUpdate({id_str: session.userId}, {$set: {latLng: session.userLatLng}}, {returnNewDocument: true})
			.then(resolve).catch(reject);
	});
});

module.exports = user;
