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
app.get('/dataviz', ondataviz);

// Routers
app.use('/auth', onauth(io));

server.listen(app.get('port'), err => {
	if (err) {
		debug(err);
	}

	debug(`⌗ Twitter dataviz running: http://localhost:${app.get('port')}`);
});
