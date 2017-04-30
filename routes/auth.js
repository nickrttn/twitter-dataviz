const qs = require('querystring');
const crypto = require('crypto');
const debug = require('debug')('auth');
const express = require('express');
const superagent = require('superagent');

const router = new express.Router();

router.get('/twitter/signin', onsignin);
router.get('/twitter/callback', oncallback);

function onsignin(req, res) {
	requestToken((err, postRes) => {
		if (err) {
			debug(err);
			return res.redirect('/');
		}

		if (postRes.status === 200) {
			const reqToken = qs.parse(postRes.text);
			if (reqToken.oauth_callback_confirmed === 'true') {
				req.session.requestToken = reqToken.oauth_token;
				req.session.requestTokenSecret = reqToken.oauth_token_secret;

				const params = qs.stringify({oauth_token: reqToken.oauth_token}); // eslint-disable-line camelcase
				return res.redirect(302, `https://api.twitter.com/oauth/authenticate?${params}`);
			}
		}

		res.redirect('/');
	});
}

function oncallback(req, res) {
	if (req.query.oauth_token === req.session.requestToken) {
		accessToken(req.query, (err, postRes) => {
			if (err) {
				debug(err);
				return res.redirect('/');
			}

			const oauthToken = qs.parse(postRes.text);

			req.session.oauthToken = oauthToken.oauth_token;
			req.session.oauthTokenSecret = oauthToken.oauth_token_secret;
			req.session.userId = oauthToken.user_id;
			req.session.screenName = oauthToken.screen_name;

			res.redirect('/dataviz');
		});

		return;
	}

	res.redirect('/');
}

function requestToken(callback) {
	superagent
		.post('https://api.twitter.com/oauth/request_token')
		.set({Accept: '*/*'})
		.set(oAuthHeaders('POST', 'https://api.twitter.com/oauth/request_token', {
			oauth_callback: process.env.TWITTER_OAUTHCALLBACK // eslint-disable-line camelcase
		}))
		.end(callback);
}

function accessToken(query, callback) {
	superagent
		.post('https://api.twitter.com/oauth/access_token')
		.set({Accept: '*/*'})
		.set(oAuthHeaders('POST', 'https://api.twitter.com/oauth/access_token', {
			oauth_token: query.oauth_token // eslint-disable-line camelcase
		}))
		.send(`oauth_verifier=${query.oauth_verifier}`)
		.end(callback);
}

function oAuthHeaders(method, url, params) {
	// https://stackoverflow.com/questions/6554039/how-do-i-url-encode-something-in-node-js
	// https://stackoverflow.com/questions/25250551/how-to-generate-timestamp-unix-epoch-format-nodejs
	params = Object.assign({
		oauth_consumer_key: process.env.TWITTER_APIKEY, // eslint-disable-line camelcase
		oauth_nonce: crypto.randomBytes(32).toString('hex'), // eslint-disable-line camelcase
		oauth_signature_method: 'HMAC-SHA1', // eslint-disable-line camelcase
		oauth_timestamp: `${Math.floor(new Date() / 1000)}`, // eslint-disable-line camelcase
		oauth_version: '1.0' // eslint-disable-line camelcase
	}, params);

	let sorted = objSort(params);
	sorted.oauth_signature = sign({method, url, params: sorted}); // eslint-disable-line camelcase
	sorted = objSort(sorted);

	const headers = Object.keys(sorted).reduce((acc, key, idx, arr) => {
		acc += `${key}="${qs.escape(sorted[key])}"`;

		if (idx !== arr.length - 1) {
			acc += ', ';
		}

		return acc;
	}, 'OAuth ');

	debug(headers);

	return {Authorization: headers};
}

function sign(obj) {
	const baseString = Object.keys(obj).map(key => {
		if (key === 'method') {
			return obj[key].toUpperCase();
		}

		if (key === 'url') {
			return qs.escape(obj[key]);
		}

		return qs.escape(qs.stringify(obj[key]));
	}).join('&');

	const key = `${qs.escape(process.env.TWITTER_APISECRET)}&${obj.params.oauth_token ? qs.escape(obj.params.oauthtoken) : ''}`;

	return crypto.createHmac('sha1', key).update(baseString).digest('base64');
}

function objSort(obj) {
	// https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
	const sorted = {};
	Object.keys(obj).sort().forEach(key => {
		sorted[key] = obj[key];
	});
	return sorted;
}

module.exports = router;
