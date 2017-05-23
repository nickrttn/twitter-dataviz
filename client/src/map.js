const L = require('leaflet');
const io = require('socket.io-client');
const scale = require('d3-scale').scaleLinear;
const d3Geo = require('d3-geo');
const plur = require('plur');

const terminator = require('./terminator');

(function () {
	'use strict';
	const socket = io('/map');

	const filters = [];

	// Instantiate the leaflet map
	const map = L.map(document.querySelector('.map div'), {
		center: [30, 0],
		zoom: 2,
		minZoom: 1,
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
	const color = scale().domain([-5, 5]).range(['#d33682', '#2aa198']);
	const tweets = L.geoJSON(null, {
		pointToLayer: (point, latlng) => {
			const tweet = point.properties.tweet;
			const includesFilter = filters.reduce((acc, curr) => acc || tweet.includes(curr), false);
			return L.circle(latlng, {
				radius: 10,
				opacity: filters.length ? (includesFilter ? 1 : 0.5) : 1,
				fillOpacity: filters.length ? (includesFilter ? 0.5 : 1) : 1,
				color: color(point.properties.sentiment.polarity)
			});
		},
		onEachFeature: (feature, layer) => {
			layer.bindTooltip(feature.properties.tweet);
		}
	}).addTo(map);

	tweets.on('layeradd', () => {
		const layers = tweets.getLayers();
		if (layers.length > 500) {
			for (let i = layers.length - 1; layers.length === 500; i--) {
				tweets.removeLayer(layers[i].getLayerId());
			}
		}
	});

	socket.on('place', addTweet);

	function addTweet(tweet) {
		tweets.addData({
			type: 'Point',
			coordinates: tweet.coordinates || d3Geo.geoCentroid(tweet.bounding_box),
			properties: {
				tweet: tweet.text,
				timestamp: tweet.timestamp || Date.now(),
				sentiment: tweet.sentiment,
				hasFilter: tweet.hasFilter
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
			filterlayers(evt.target.dataset.query);
		}
	}

	function filterlayers(query) {
		const q = decodeURIComponent(query).replace(/\+/g, ' ');

		if (filters.indexOf(q) === -1) {
			filters.push(q);
		} else {
			filters.splice(filters.indexOf(q), 1);
		}

		tweets.eachLayer(layer => {
			const tweet = layer.feature.geometry.properties.tweet;
			const includesFilter = filters.reduce((acc, curr) => acc || tweet.includes(curr), false);
			layer.setStyle({
				opacity: filters.length ? (includesFilter ? 1 : 0.35) : 1,
				fillOpacity: filters.length ? (includesFilter ? 1 : 0.35) : 1
			});
		});
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
		map.flyTo(L.latLng(latitude, longitude), 3);
	}

	function onPosError(err) {
		if (err.code === 1) {
			socket.emit('userLocation', 'world');
		}
	}

	function toggleLoader() {
		document.querySelector('.loader').classList.toggle('hide');
	}

	socket.on('connect', () => {
		const activeFilters = [...document.querySelectorAll('.trends .selected')]
			.map(filter => filter.dataset.query);
		socket.emit('filters', activeFilters);
	});

	// Successful reconnect
	socket.on('reconnect', n => {
		document.querySelector('.notification p').textContent = `You've reconnected after ${n} ${plur('try', n)} 🎉`;

		setTimeout(() => {
			document.querySelector('.notification').classList.add('hide');
		}, 3000);
	});

	socket.on('connect_error', err => {
		console.error(err);
		document.querySelector('.notification').classList.remove('hide');
	});

	socket.on('reconnect_attempt', n => {
		document.querySelector('.notification p').textContent = `You seem to be offline 😢 Reconnection attempt #${n}`;
	});

	socket.on('connect_timeout', console.warn);
})();
