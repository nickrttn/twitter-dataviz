const io = require('socket.io-client');

(function () {
	'use strict';
	const socket = io();
	const section = document.querySelector('.colors');

	socket.on('colors', clrs => {
		clrs.forEach(add);
	});

	function add(el) {
		section.insertAdjacentHTML('beforeend', el);
	}
})();
