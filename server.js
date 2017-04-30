const debug = require('debug')('datavis');
const express = require('express');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const onindex = require('./routes/index');
const onauth = require('./routes/auth');

require('dotenv').config();

const app = express();

// ExpressJS config
app.set('x-powered-by', false);
app.set('port', process.env.PORT);
app.set('view engine', 'ejs');

// Sessions
app.use(session({
	store: new RedisStore({
		client: redis.createClient()
	}),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {}
}));

// Routes
app.get('/', onindex);

// Routers
app.use('/auth', onauth);

app.listen(app.get('port'), err => {
	if (err) {
		debug(err);
	}

	debug(`⌗ Twitter dataviz running: http://localhost:${app.get('port')}`);
});
