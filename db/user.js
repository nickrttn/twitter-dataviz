/* eslint camelcase: 0 */
const debug = require('debug')('user');
const Twitter = require('twitter');

const connect = require('./connect');

const user = {};

user.save = req => new Promise((resolve, reject) => {
	const client = new Twitter({
		consumer_key: process.env.TV_TWITTER_APIKEY,
		consumer_secret: process.env.TV_TWITTER_APISECRET,
		access_token_key: req.session.oauthToken,
		access_token_secret: req.session.oauthTokenSecret
	});

	client.get('account/verify_credentials', {
		include_entities: false,
		skip_status: true,
		include_email: false
	}, (err, res) => {
		if (err) {
			req.session.errors = res.errors;
			reject(err);
		}

		connect.then(db => {
			db.collection('users')
				.findOneAndUpdate({_id: res.id}, {$set: Object.assign({
					oauthToken: req.session.oauthToken,
					oauthTokenSecret: req.session.oauthTokenSecret
				}, res)}, {upsert: true, returnOriginal: false})
				.then(resolve).catch(reject);
		});
	});
});

user.location = req => new Promise((resolve, reject) => {
	connect.then(db => {
		db.collection('users')
			.findOneAndUpdate({id_str: req.session.userId}, {$set: {latLng: req.session.userLatLng}}, {returnNewDocument: true})
			.then(resolve).catch(reject);
	});
});

module.exports = user;
