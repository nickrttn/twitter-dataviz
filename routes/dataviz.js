const debug = require('debug')('dataviz');
const qs = require('querystring');
const express = require('express');
const retext = require('retext');
const sentiment = require('retext-sentiment');

const twitter = require('../lib/twitter');
const emitter = require('../lib/stream');
const user = require('../db/user');

const router = new express.Router();

// Closure used for passing io to a router
module.exports = io => {
	let stream;
	let filters = [];

	io.on('connection', socket => {
		socket.on('disconnect', () => {
			if (stream && io.engine.clientsCount === 0) {
				stream.destroy();
				stream.on('end', () => {
					stream = undefined;
				});
			}
		});
	});

	// First, store the users' data
	router.get('/', (req, res, next) => {
		user.save(req).then(user => {
			const {name, screen_name: screenName} = user.value;
			req.session.name = name;
			req.session.screenName = screenName;

			next();
		});
	});

	router.get('/', onindex);
	router.get('/colors', oncolors);
	router.get('/map', onmap);

	function onindex(req, res) {
		res.render('pages/dataviz.ejs', {
			errors: req.session.errors,
			user: req.session.screenName,
			name: req.session.name
		});

		req.session.errors = null;
	}

	function oncolors(req, res) {
		// Reset possible errors
		req.session.errors = null;

		// Define the namespace
		const namespace = io.of('/colors');

		// Init the stream if there isn't any
		if (!stream) {
			stream = emitter(req.session);
		}

		// Send the user a page
		res.render('pages/colors.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
		});

		namespace.on('connection', socket => {
			// Init the stream if there isn't any
			if (!stream) {
				stream = emitter(req.session);
			}

			// Attach an event listener to the emitter
			stream.on('data', ontweet);

			// Create an empty colors array
			let colors = [];

			function ontweet(tweet) {
				colors.push(`<div style="background-color:#${tweet.user.profile_link_color}"></div>`);
			}

			function send() {
				socket.emit('colors', colors);
				colors = [];
				setTimeout(send, 50);
			}

			send();
		});
	}

	function onmap(req, res) {
		// Reset possible errors
		req.session.errors = null;

		// Define the namespace
		const namespace = io.of('/map');

		// Send the user a page
		res.render('pages/map.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
		});

		namespace.on('connection', socket => {
			// Init the stream if there isn't any
			if (!stream) {
				stream = emitter(req.session);
			}

			const processor = retext().use(sentiment);

			function tweetMood(tweet) {
				return processor.run(processor.parse(tweet));
			}

			// Attach an event listener to the emitter
			stream.on('data', ontweet);

			function ontweet(tweet) {
				if (tweet.coordinates) {
					tweetMood(tweet.text).then(mood => {
						socket.emit('place', Object.assign({
							sentiment: mood.data
						}, tweet.coordinates));
					});
				}

				if (tweet.place) {
					tweetMood(tweet.text).then(mood => {
						socket.emit('place', Object.assign({
							sentiment: mood.data
						}, tweet.place));
					});
				}
			}

			socket.on('userLocation', loc => {
				req.session.userLatLng = loc;
				user.location(req)
					.then(user => twitter.trendingClosest(user.value))
					.then(trends => socket.emit('closestTrends', trends))
					.catch(err => {
						req.session.errors = err;
						debug(err);
					});
			});

			socket.on('filter', query => {
				if (filters.indexOf(query) === -1) {
					filters.push(query);
				} else {
					filters.splice(filters.indexOf(query), 1);
				}

				console.log(filters);
			});
		});
	}

	return router;
};
