module.exports = {
	objSort: obj => {
		// https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
		const sorted = {};
		Object.keys(obj).sort().forEach(key => {
			sorted[key] = obj[key];
		});
		return sorted;
	}
};
