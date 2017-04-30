const debug = require('debug')('datavis');
const express = require('express');

const onindex = require('./routes/index');

require('dotenv').config();

const app = express();

app.set('x-powered-by', false);
app.set('port', process.env.PORT);
app.set('view engine', 'ejs')

app.get('/', onindex);

app.listen(app.get('port'), err => {
	if (err) debug(err);
	debug(`⌗ Twitter dataviz running: http://localhost:${app.get('port')}`);
});
