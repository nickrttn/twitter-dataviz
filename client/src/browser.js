const h = require('virtual-dom/h');
const diff = require('virtual-dom/diff');
const patch = require('virtual-dom/patch');
const createElement = require('virtual-dom/create-element');
const io = require('socket.io-client');

(function () {
	'use strict';
	const socket = io();

	let colors = [];
	let tree = render(colors);
	let rootNode = createElement(tree);

	document.body.appendChild(rootNode);

	socket.on('colors', clrs => {
		colors = colors.concat(clrs);
		const newTree = render(colors);
		const patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;
	});

	function render(colors) {
		return h(
			'section',
			{className: 'colors'},
			colors.map((clr, idx) => h('div', {key: idx, style: {backgroundColor: `#${clr}`}}))
		);
	}
})();
