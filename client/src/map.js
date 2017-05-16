const io = require('socket.io-client');
const geoPath = require('d3-geo').geoPath;
const geoCentroid = require('d3-geo').geoCentroid;
const geoCircle = require('d3-geo').geoCircle;
const geoMercator = require('d3-geo').geoMercator;
const utcDay = require('d3-time').utcDay;
const select = require('d3-selection').select;
const request = require('d3-request').json;
const feature = require('topojson-client').feature;

(function () {
	'use strict';

	const socket = io('/map');

	const {width, height} = document.querySelector('.map').getBoundingClientRect();

	// Nighttime map
	// Source: http://bl.ocks.org/mbostock/4597134
	const π = Math.PI;
	const radians = π / 180;
	const degrees = 180 / π;

	const projection = geoMercator()
		.translate([width / 2, height / 2])
		.scale(153 / 960 * width)
		.precision(0.1);

	const path = geoPath()
		.projection(projection)
		.pointRadius(2);

	const circle = geoCircle();

	const place = geoCircle()
		.center(point => point)
		.radius(1);

	const svg = select('.map').append('svg')
		.attr('width', width)
		.attr('height', height);

	request('https://unpkg.com/world-atlas@1/world/110m.json', (err, world) => {
		if (err) throw err; // eslint-disable-line curly

		svg.append('path')
			.datum(feature(world, world.objects.land))
			.attr('class', 'land')
			.attr('d', path);

		const night = svg.append('path')
			.attr('class', 'night')
			.attr('d', path);

		redraw();
		setInterval(redraw, 1000);

		function redraw() {
			night.datum(circle.center(antipode(solarPosition(new Date)))).attr("d", path);
		}
	});

	socket.on('location', loc => {
		svg.append('path')
			.datum(loc)
			.attr('class', 'tweet')
			.attr('d', path);
	});

	socket.on('place', loc => {
		if (loc.place_type === 'city') {
			svg.append('path')
				.datum(place(geoCentroid(loc.bounding_box)))
				.style('fill-opacity', '1')
				.style('stroke-opacity', '1')
				.attr('class', 'place')
				.attr('d', path);
		}

		const places = document.querySelectorAll('.place');
		for (let i = places.length - 1; i >= 0; i--) {
			places[i].style.fillOpacity -= 0.01;
			places[i].style.strokeOpacity -= 0.01;

			if (places[i].style.fillOpacity === 0) {
				console.log('0 opacity');
				places[i].remove();
			}
		}

		document.querySelectorAll('.place').forEach(place => {
			place.style.fillOpacity -= 0.01;
			place.style.strokeOpacity -= 0.01;

			if (place.style.fillOpacity === 0) {
				place.remove();
			}
		});
	});

	function antipode(position) {
	  return [position[0] + 180, -position[1]];
	}

	function solarPosition(time) {
	  const centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525, // since J2000
	      longitude = (utcDay.floor(time) - time) / 864e5 * 360 - 180;
	  return [
	    longitude - equationOfTime(centuries) * degrees,
	    solarDeclination(centuries) * degrees
	  ];
	}

	function equationOfTime(centuries) {
	  const e = eccentricityEarthOrbit(centuries);
		const m = solarGeometricMeanAnomaly(centuries);
	  const l = solarGeometricMeanLongitude(centuries);
	  let y = Math.tan(obliquityCorrection(centuries) / 2);
	  y *= y;
	  return y * Math.sin(2 * l)
	      - 2 * e * Math.sin(m)
	      + 4 * e * y * Math.sin(m) * Math.cos(2 * l)
	      - 0.5 * y * y * Math.sin(4 * l)
	      - 1.25 * e * e * Math.sin(2 * m);
	}

	function solarDeclination(centuries) {
	  return Math.asin(Math.sin(obliquityCorrection(centuries)) * Math.sin(solarApparentLongitude(centuries)));
	}

	function solarApparentLongitude(centuries) {
	  return solarTrueLongitude(centuries) - (0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * centuries) * radians)) * radians;
	}

	function solarTrueLongitude(centuries) {
	  return solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries);
	}

	function solarGeometricMeanAnomaly(centuries) {
	  return (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * radians;
	}

	function solarGeometricMeanLongitude(centuries) {
	  const l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
	  return (l < 0 ? l + 360 : l) / 180 * π;
	}

	function solarEquationOfCenter(centuries) {
	  const m = solarGeometricMeanAnomaly(centuries);
	  return (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
	      + Math.sin(m + m) * (0.019993 - 0.000101 * centuries)
	      + Math.sin(m + m + m) * 0.000289) * radians;
	}

	function obliquityCorrection(centuries) {
	  return meanObliquityOfEcliptic(centuries) + 0.00256 * Math.cos((125.04 - 1934.136 * centuries) * radians) * radians;
	}

	function meanObliquityOfEcliptic(centuries) {
	  return (23 + (26 + (21.448 - centuries * (46.8150 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60) * radians;
	}

	function eccentricityEarthOrbit(centuries) {
	  return 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
	}
})();
