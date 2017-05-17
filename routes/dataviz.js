const debug = require('debug')('dataviz');
const express = require('express');

const user = require('../db/user');

const router = new express.Router();

const emitter = require('../lib/stream');

// Closure used for passing io to a router
module.exports = io => {
	let stream;

	// First, store the users' data in CouchDB
	router.use((req, res, next) => {
		user.save(req).then(user => {
			const {name, screen_name: screenName} = user.value;
			req.session.name = name;
			req.session.screenName = screenName;

			debug(req.session);

			next();
		});
	});

	router.use((req, res, next) => {
		// Start the Twitter stream before routing
		if (!stream) {
			stream = emitter(req.session);
		}

		next();
	});

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

	router.get('/', onindex);
	router.get('/colors', oncolors);
	router.get('/map', onmap);

	function onindex(req, res) {
		res.render('pages/dataviz.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
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

			// Attach an event listener to the emitter
			stream.on('data', ontweet);

			let count = 0;
			function ontweet(tweet) {
				if (tweet.coordinates) {
					socket.emit('location', tweet.coordinates);
					count++;
					debug(count);
				}

				if (tweet.place) {
					socket.emit('place', tweet.place);
					count++;
					debug(count);
				}
			}
		});
	}

	return router;
};
