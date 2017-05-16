const path = require('path');
const http = require('http').Server;
const express = require('express');
const socketio = require('socket.io');
const debug = require('debug')('server');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const onindex = require('./routes/index');
const ondataviz = require('./routes/dataviz');
const onauth = require('./routes/auth');

require('dotenv').config();

const app = express();
const server = http(app);
const io = socketio(server);

// ExpressJS config
app.set('x-powered-by', false);
app.set('port', process.env.TV_PORT);
app.set('view engine', 'ejs');

const redisClient = process.env.TV_REDIS_PASSWORD ?
	redis.createClient({password: process.env.TV_REDIS_PASSWORD}) :
	redis.createClient();

// Sessions
app.use(session({
	store: new RedisStore({
		client: redisClient
	}),
	secret: process.env.TV_SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {}
}));

// Static files
app.use('/assets', express.static(path.join(__dirname, 'client/build')));

// Routes
app.get('/', onindex);

// Routers
app.use('/auth', onauth);
app.use('/dataviz', ondataviz(io));

server.listen(app.get('port'), err => {
	if (err) {
		debug(err);
	}

	debug(`⌗ Twitter dataviz running: http://localhost:${app.get('port')}`);
});

module.exports = server;
