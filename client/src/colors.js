const io = require('socket.io-client');

(function () {
	'use strict';
	const socket = io('/colors');
	const section = document.querySelector('.colors');

	socket.on('colors', clrs => {
		add(clrs.reduce((acc, clr) => acc + clr, ''));
	});

	function add(el) {
		section.insertAdjacentHTML('beforeend', el);
	}
})();
