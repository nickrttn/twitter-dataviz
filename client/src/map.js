const L = require('leaflet');
const io = require('socket.io-client');
const scale = require('d3-scale').scaleLinear;
const d3Geo = require('d3-geo');

const terminator = require('./terminator');

(function () {
	'use strict';
	const socket = io('/map');
	const color = scale().domain([-5, 5]).range(['#dc322f', '#859900']);

	// Instantiate the leaflet map
	const map = L.map(document.querySelector('.map div'), {
		center: [30, 0],
		zoom: 2,
		worldCopyJump: true
	});

	// Add a MapBox tile layer
	L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibmlja3J0dG4iLCJhIjoiY2oydWJlamY4MDA4eTM4bm95bjFheXVudiJ9.FmgSn1ZLUu4Wqi149dKYHw', {
		maxZoom: 18,
		accessToken: 'pk.eyJ1Ijoibmlja3J0dG4iLCJhIjoiY2oydWJlamY4MDA4eTM4bm95bjFheXVudiJ9',
		detectRetina: true
	}).addTo(map);

	// Add the solar terminator and set an interval to update it
	const solarTerminator = terminator().addTo(map);
	setInterval(updateTerminator, 5000);
	function updateTerminator() {
		solarTerminator.setTime(new Date());
	}

	// Add an empty GeoJSON layer for tweets and set up styling
	const tweets = L.geoJSON(null, {
		pointToLayer: (geoJsonPoint, latlng) => L.circle(latlng, {radius: 10, fillOpacity: 1}),
		style: geoJsonFeature => ({
			color: color(geoJsonFeature.geometry.properties.sentiment.polarity)
		})
	}).addTo(map);

	tweets.on('layeradd', evt => {
		tweets.eachLayer(layer => {
			layer.setStyle({fillOpacity: layer.options.fillOpacity - 0.002});

			if (layer.options.fillOpacity <= 0) {
				layer.remove();
			}
		});
	});

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

	socket.on('closestTrends', data => {
		if (!document.querySelector('.loader').classList.contains('hide')) {
			toggleLoader();
		}

		showTrends(data.trends);
	});

	function showTrends(trends) {
		const parent = document.querySelector('.filters');

		if (parent.classList.contains('hide')) {
			parent.classList.remove('hide');
		}

		// Remove old trends if any
		const node = document.querySelector('.trends');
		if (node) {
			node.parentNode.removeChild(node);
		}

		// Put trends in the DOM
		parent
			.insertAdjacentHTML('beforeend', `<ul class="trends">${trends.reduce((acc, curr) => {
				return acc + `
					<li><button data-query="${curr.query}">${curr.name}</button></li>
				`;
			}, '')}</ul>`);

		// Add an event listener to the list
		document.querySelector('.trends').addEventListener('click', ontrendclick);
	}

	function ontrendclick(evt) {
		evt.target.classList.toggle('selected');

		if (evt.target.dataset.query) {
			socket.emit('filter', evt.target.dataset.query);
		}
	}

	document.querySelector('[data-toggle="trends"]').addEventListener('click', onfiltertoggle);

	function onfiltertoggle() {
		this.classList.toggle('hide');
		toggleLoader();

		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(onPosSuccess, onPosError, {enableHighAccuracy: true});
		}
	}

	function onPosSuccess(loc) {
		const {latitude, longitude} = loc.coords;
		socket.emit('userLocation', {latitude, longitude});
		map.flyTo(L.latLng(latitude, longitude), 5);
	}

	function onPosError(err) {
		console.warn(err);
	}

	function toggleLoader() {
		document.querySelector('.loader').classList.toggle('hide');
	}
})();
