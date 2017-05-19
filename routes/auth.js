const qs = require('querystring');
const debug = require('debug')('auth');
const express = require('express');
const superagent = require('superagent');

const auth = require('../lib/auth');

const router = new express.Router();

router.get('/twitter/signin', onsignin);
router.get('/twitter/callback', oncallback);

function onsignin(req, res) {
	requestToken((err, postRes) => {
		if (err) {
			req.session.errors = JSON.parse(err.response.text).errors;
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
				req.session.errors = JSON.parse(err.response.text).errors;
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
		.set(auth.headers('POST', 'https://api.twitter.com/oauth/request_token', {
			oauth_callback: process.env.TV_TWITTER_OAUTHCALLBACK // eslint-disable-line camelcase
		}))
		.end(callback);
}

function accessToken(query, callback) {
	superagent
		.post('https://api.twitter.com/oauth/access_token')
		.set({Accept: '*/*'})
		.set(auth.headers('POST', 'https://api.twitter.com/oauth/access_token', {
			oauth_token: query.oauth_token // eslint-disable-line camelcase
		}))
		.send(`oauth_verifier=${query.oauth_verifier}`)
		.end(callback);
}

module.exports = router;
