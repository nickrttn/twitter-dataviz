/* eslint camelcase: 0 */
const debug = require('debug')('user');

const connect = require('./connect');

const trends = {};

trends.save = (trends, user) => new Promise((resolve, reject) => {
	console.log(user);
	connect.then(db => {
		db.collection('trends')
			.findOneAndUpdate({user_id: user._id}, {
				$set: {trends, timestamp: Date.now(), location: user.latLng}
			}, {upsert: true, returnNewDocument: true})
			.then(doc => resolve(doc.value)).catch(reject);
	});
});

trends.find = user => new Promise((resolve, reject) => {
	connect.then(db => {
		db.collection('trends')
			.findOne({user_id: user._id}).then(resolve).catch(reject);
	});
});

module.exports = trends;
