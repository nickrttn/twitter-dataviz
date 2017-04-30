const debug = require('debug')('dataviz');
const Twitter = require('twitter');

module.exports = (req, res) => {
	res.render('pages/dataviz.ejs', {
		errors: req.session.errors,
		user: req.session.screenName
	});

	if (req.session.error) {
		req.session.error = null;
	}

	stream(req.session);
};

function stream(session) {
	const client = new Twitter({
		consumer_key: process.env.TWITTER_APIKEY, // eslint-disable-line camelcase
		consumer_secret: process.env.TWITTER_APISECRET, // eslint-disable-line camelcase
		access_token_key: session.oauthToken, // eslint-disable-line camelcase
		access_token_secret: session.oauthTokenSecret // eslint-disable-line camelcase
	});

	const stream = client.stream('statuses/sample');

	stream.on('data', evt => {
		// debug(evt && evt.coordinates);
		// debug(evt && evt.favorite_count > 0);
		debug(evt && evt.place && evt.place.bounding_box);
	});

	stream.on('error', err => {
		debug(err);
	});
}

// tweet length
// emoji's
// location (map)
// hashtags
//
