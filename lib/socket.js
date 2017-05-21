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

		socket.on('disconnect', () => {
			if (stream && io.engine.clientsCount === 0) {
				stream.destroy();
				stream.on('end', () => {
					stream = undefined;
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

		socket.handshake.session.filters = [];
		socket.handshake.session.filtersActive = false;

		function tweetMood(tweet) {
			return processor.run(processor.parse(tweet));
		}

		function ontweet(tweet) {
			if (tweet.coordinates || tweet.place) {
				if (socket.handshake.session.filtersActive) {
					const filters = socket.handshake.session.filters;
					return emitTweet(tweet, filters.reduce((acc, curr) => acc || tweet.text.includes(curr), false));
				}

				return emitTweet(tweet, false);
			}
		}

		function emitTweet(tweet, hasFilter) {
			tweetMood(tweet.text).then(mood => {
				socket.emit('place', Object.assign({
					text: tweet.text,
					sentiment: mood.data,
					hasFilter
				}, tweet.coordinates || tweet.place));
			});
		}

		// Attach an event listener to the emitter
		stream.on('data', ontweet);

		socket.on('userLocation', loc => {
			socket.handshake.session.userLatLng = loc;

			user.location(socket.handshake.session)
				.then(user => twitter.trendingClosest(user.value))
				.then(trends => socket.emit('closestTrends', trends))
				.catch(err => {
					socket.handshake.session.errors = err;
				});
		});

		socket.on('filter', query => {
			const filters = socket.handshake.session.filters;
			const q = decodeURIComponent(query).replace(/\+/g, ' ');

			if (filters.indexOf(q) === -1) {
				filters.push(q);
			} else {
				filters.splice(filters.indexOf(q), 1);
			}

			socket.handshake.session.filtersActive = filters.length > 0;
		});

		// Sync the filters after a reconnect
		socket.on('filters', activeFilters => {
			socket.handshake.session.filters = activeFilters
				.map(filter => decodeURIComponent(filter).replace(/\+/g, ' '));

			if (socket.handshake.session.filters.length > 0) {
				socket.handshake.session.filtersActive = true;
			}
		});
	});

	io.on('error', debug);
};
