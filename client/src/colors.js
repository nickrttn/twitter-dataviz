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

	socket.on('connect_error', err => {
		console.error(err);
		document.querySelector('.notification').classList.remove('hide');
	});

	socket.on('reconnect_attempt', n => {
		document.querySelector('.notification p').textContent = `You seem to be offline 😢 Reconnection attempt #${n}`;
	});

	// Successful reconnect
	socket.on('reconnect', n => {
		document.querySelector('.notification p').textContent = `You've reconnected after ${n} ${plur('try', n)} 🎉`;

		setTimeout(() => {
			document.querySelector('.notification').classList.add('hide');
		}, 3000);
	});
})();
