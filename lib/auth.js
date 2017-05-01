const qs = require('querystring');
const crypto = require('crypto');
const debug = require('debug')('auth');

const util = require('./util');

const auth = {};

auth.sign = (obj, secret) => {
	const key = `${qs.escape(process.env.TV_TWITTER_APISECRET)}&${secret ? qs.escape(secret) : ''}`;
	const baseString = Object.keys(obj).map(key => {
		if (key === 'method') {
			return obj[key].toUpperCase();
		}

		if (key === 'url') {
			return qs.escape(obj[key]);
		}

		return qs.escape(qs.stringify(obj[key]));
	}).join('&');

	return crypto.createHmac('sha1', key).update(baseString).digest('base64');
};

auth.headers = (method, url, params, secret) => {
	// https://stackoverflow.com/questions/6554039/how-do-i-url-encode-something-in-node-js
	// https://stackoverflow.com/questions/25250551/how-to-generate-timestamp-unix-epoch-format-nodejs
	params = Object.assign({
		oauth_consumer_key: process.env.TV_TWITTER_APIKEY, // eslint-disable-line camelcase
		oauth_nonce: crypto.randomBytes(32).toString('hex'), // eslint-disable-line camelcase
		oauth_signature_method: 'HMAC-SHA1', // eslint-disable-line camelcase
		oauth_timestamp: `${Math.floor(new Date() / 1000)}`, // eslint-disable-line camelcase
		oauth_version: '1.0' // eslint-disable-line camelcase
	}, params);

	let sorted = util.objSort(params);
	sorted.oauth_signature = auth.sign({method, url, params: sorted}, secret); // eslint-disable-line camelcase
	sorted = util.objSort(sorted);

	const headers = Object.keys(sorted).reduce((acc, key, idx, arr) => {
		acc += `${key}="${qs.escape(sorted[key])}"`;

		if (idx !== arr.length - 1) {
			acc += ', ';
		}

		return acc;
	}, 'OAuth ');

	return {Authorization: headers};
};

module.exports = auth;
