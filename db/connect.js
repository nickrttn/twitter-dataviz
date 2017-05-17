const debug = require('debug')('db');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config();

module.exports = MongoClient.connect(process.env.TV_MONGODB_URL).catch(debug);
