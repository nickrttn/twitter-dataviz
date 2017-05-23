module.exports = {
	objSort: obj => {
		// https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
		const sorted = {};
		Object.keys(obj).sort().forEach(key => {
			sorted[key] = obj[key];
		});
		return sorted;
	},
	objCompare: (a, b) => {
		// http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
		if (a === undefined || b === undefined) {
			return false;
		}

		const aProps = Object.getOwnPropertyNames(a);
		const bProps = Object.getOwnPropertyNames(b);

		if (aProps.length !== bProps.length) {
			return false;
		}

		for (let i = 0; i < aProps.length; i++) {
			const propName = aProps[i];

			if (a[propName] !== b[propName]) {
				return false;
			}
		}

		return true;
	}
};

