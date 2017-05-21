const express = require('express');

const user = require('../db/user');

const router = new express.Router();

router.get('/', (req, res, next) => {
	user.save(req).then(user => {
		const {name, screen_name: screenName} = user.value;
		req.session.name = name;
		req.session.screenName = screenName;

		next();
	});
});

router.get('/', onindex);
router.get('/colors', oncolors);
router.get('/map', onmap);

function onindex(req, res) {
	res.render('pages/dataviz.ejs', {
		errors: req.session.errors,
		user: req.session.screenName,
		name: req.session.name
	});

	req.session.errors = null;
}

function oncolors(req, res) {
	// Send the user a page
	res.render('pages/colors.ejs', {
		errors: req.session.errors,
		user: req.session.screenName
	});

	// Reset possible errors
	req.session.errors = null;
}

function onmap(req, res) {
	// Reset possible errors
	req.session.errors = null;

	// Send the user a page
	res.render('pages/map.ejs', {
		errors: req.session.errors,
		user: req.session.screenName
	});
}

module.exports = router;
