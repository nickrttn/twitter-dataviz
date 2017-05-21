const debug = require('debug')('socket');
const sharedSession = require('express-socket.io-session');
const retext = require('retext');
const sentiment = require('retext-sentiment');

const user = require('../db/user');
const twitter = require('../lib/twitter');
const emitter = require('./stream');

module.exports = (io, session) => {
	let stream;

	// Namespaces
	const colors = io.of('/colors');
	const map = io.of('/map');

	// Attach the session to the namespaces
	colors.use(sharedSession(session, {autoSave: true}));
	map.use(sharedSession(session, {autoSave: true}));

	// Connection middleware to attach a listener to a disconnect event
	io.on('connection', socket => {
		// Init the stream if there isn't any
		if (!stream) {
			stream = emitter(socket.handshake.session);
		}

		debug('connected', stream);

		socket.on('disconnect', () => {
			if (stream && io.engine.clientsCount === 0) {
				stream.destroy();
				stream.on('end', () => {
					stream = undefined;
					debug('disconnected', stream);
				});
			}
		});
	});

	// Handle the colors namespace
	colors.on('connection', socket => {
		// Create an empty colors array
		let colors = [];

		function ontweet(tweet) {
			colors.push(`<div style="background-color:#${tweet.user.profile_link_color}"></div>`);
		}

		stream.on('data', ontweet);

		function send() {
			socket.emit('colors', colors);
			colors = [];
			setTimeout(send, 50);
		}

		send();
	});

	// Handle the map
	map.on('connection', socket => {
		const processor = retext().use(sentiment);
		const filters = [];

		function tweetMood(tweet) {
			return processor.run(processor.parse(tweet));
		}

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

		// Attach an event listener to the emitter
		stream.on('data', ontweet);

		socket.on('userLocation', loc => {
			debug(socket.handshake.session);
			socket.handshake.session.userLatLng = loc;
			user.location(socket.handshake.session)
				.then(user => twitter.trendingClosest(user.value))
				.then(trends => socket.emit('closestTrends', trends))
				.catch(err => {
					socket.handshake.session.errors = err;
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

	io.on('error', debug);
};
