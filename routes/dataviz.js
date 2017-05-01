const debug = require('debug')('dataviz');
const express = require('express');

const emitter = require('../lib/stream');
let stream;

const router = new express.Router();

// Closure used for passing io to a router
module.exports = io => {
	router.use((req, res, next) => {
		if (!stream) {
			stream = emitter(req.session);
		}

		next();
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
		const namespace = io.of('/colors');

		res.render('pages/colors.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
		});

		// Reset possible errors
		req.session.errors = null;

		// Attach an event listener to the emitter
		stream.on('data', ontweet);

		// Create an empty colors array
		let colors = [];

		function ontweet(tweet) {
			colors.push(`<div style="background-color:#${tweet.user.profile_link_color}"></div>`);
		}

		function send() {
			namespace.emit('colors', colors);
			colors = [];
			setTimeout(send, 50);
		}

		send();
	}

	function onmap(req, res) {
		const namespace = io.of('/map');

		res.render('pages/map.ejs', {
			errors: req.session.errors,
			user: req.session.screenName
		});

		// Reset possible errors
		req.session.errors = null;

		// Attach an event listener to the emitter
		stream.on('data', ontweet);

		function ontweet(tweet) {
			if (tweet.coordinates) {
				namespace.emit('location', tweet.coordinates);
			}

			if (tweet.place) {
				namespace.emit('place', tweet.place);
			}
		}

		req.session.errors = null;
	}

	return router;
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
