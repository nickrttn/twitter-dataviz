module.exports = (req, res) => {
	res.render('pages/index', {
		error: req.session.error
	});

	req.session.error = null;
};
