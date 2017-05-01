const debug = require('debug')('dataviz');
const Twitter = require('twitter');

// Closure used for passing io to a router
module.exports = io => {
	return function (req, res) {
		res.render('pages/dataviz.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
		});

		if (req.session.errors) {
			req.session.errors = null;
		}

		stream(req.session);

		function stream(session) {
			const client = new Twitter({
				consumer_key: process.env.TWITTER_APIKEY, // eslint-disable-line camelcase
				consumer_secret: process.env.TWITTER_APISECRET, // eslint-disable-line camelcase
				access_token_key: session.oauthToken, // eslint-disable-line camelcase
				access_token_secret: session.oauthTokenSecret // eslint-disable-line camelcase
			});

			const stream = client.stream('statuses/sample');

			let colors = [];

			stream.on('data', evt => {
				colors.push(`<div style="background-color:#${evt.user.profile_link_color}"></div>`);
			});

			setTimeout(send, 0);

			function send() {
				io.emit('colors', colors);
				colors = [];
				setTimeout(send, 50);
			}

			stream.on('error', err => {
				debug(err);
			});
		}
	};
};

// tweet length
// emoji's
// location & places (map) (hoe vaak mentioned een land zichzelf) (day/nighttime)
// -- numbers followers RADIUS
// http://bl.ocks.org/mbostock/4597134 SUNLIGHT
//
// --
// hashtags (aantal)
// profile link color
