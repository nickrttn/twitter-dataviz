const L = require('leaflet');
const terminator = require('leaflet-terminator');
const io = require('socket.io-client');
const scale = require('d3-scale').scaleLinear;
const d3Geo = require('d3-geo');

(function () {
	'use strict';
	const socket = io('/map');
	const color = scale().domain([-5, 5]).range(['#dc322f', '#859900']);

	// Instantiate the leaflet map
	const map = L.map(document.querySelector('.map div'), {
		center: [30, 0],
		zoom: 2
	});

	// Add a MapBox tile layer
	L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibmlja3J0dG4iLCJhIjoiY2oydWJlamY4MDA4eTM4bm95bjFheXVudiJ9.FmgSn1ZLUu4Wqi149dKYHw', {
		maxZoom: 18,
		accessToken: 'pk.eyJ1Ijoibmlja3J0dG4iLCJhIjoiY2oydWJlamY4MDA4eTM4bm95bjFheXVudiJ9',
		detectRetina: true
	}).addTo(map);

	// add the solar terminator and update it
	const solarTerminator = terminator().addTo(map);

	const terminatorUpdate = setInterval(() => {
		solarTerminator.setDate(new Date());
	}, 5000);

	// Add an empty GeoJSON layer for tweets and set up styling
	const tweets = L.geoJSON(null, {
		pointToLayer: (geoJsonPoint, latlng) => L.circle(latlng, {radius: 3}),
		style: geoJsonFeature => ({
			color: color(geoJsonFeature.geometry.properties.sentiment.polarity)
		})
	}).addTo(map);

	socket.on('place', loc => {
		if (loc.place_type) {
			addTweet(loc);
		}
	});

	socket.on('location', loc => {
		addTweet(loc);
	});

	function addTweet(tweet) {
		tweets.addData({
			type: 'Point',
			coordinates: d3Geo.geoCentroid(tweet.bounding_box),
			properties: {
				timestamp: tweet.timestamp || Date.now(),
				sentiment: tweet.sentiment
			}
		});
	}

	const timeSelector = document.querySelector('[name="time"]');
	timeSelector.addEventListener('change', event => {
		clearInterval(terminatorUpdate);
		solarTerminator.setDate(new Date(parseInt(event.target.value, 10)));
	});
})();
