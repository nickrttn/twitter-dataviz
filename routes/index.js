const debug = require('debug')('server');

module.exports = (req, res) => {
	res.render('pages/index', {errors: req.session.errors}, (err, html) => {
		if (err) {
			debug(err);
		}

		// Reset application errors
		req.session.errors = null;

		res.send(html);
		res.end();
	});
};
