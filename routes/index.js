const debug = require('debug')('server');

module.exports = (req, res) => {
	req.session.errors = req.session.errors || [];

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
