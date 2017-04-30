const debug = require('debug')('app');
const express = require('express');

require('dotenv').config();

const app = express();

app.set('port', process.env.PORT);

app.listen(app.get('port'), err => {
	if (err) debug(err);
});
