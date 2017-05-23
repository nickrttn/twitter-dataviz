# Twitter in real-time

The application visualizes tweets with locations on a map as they come in. Twitter streams 1% of their 500 million daily tweets to the application in real-time. The application allows the user to explore the sentiment of tweets across the globe, as well as closer to them, based on their location, provided the tweets are in English. Tweets can be filtered by trending topics, either based on location, or if a user doesn't like to share theirs, based on the most popular topics worldwide. This enables a user to more closely study sentiment for topics that might interest them.

In an alternative visualization, the profile colors of every tweets' user are shown as a form of generative art.

A live demo of the application can be found at [twitterviz.unicornswithlaserguns.com](https://twitterviz.unicornswithlaserguns.com)

## Features

- oAuth 1.0a authentication w/ Twitter
- Pub/sub to the Twitter Streaming API using a NodeJS EventEmitter
- Socket.io websockets or long polling, depending on the capabilities of the client
- A map using Leaflet w/ maptiles from the Mapbox API
- Generative art
- Track Twitters' mood in real-time, on a map
- Limited offline usage

## Up and running

Follow the instructions below to get the application up and running.

### Prerequisites

1. Install Node.js (https://nodejs.org/en/download/)
2. Install Docker (https://www.docker.com/community-edition)
3. Create a new application over on https://apps.twitter.com/. You will need the API key and secret later
For the “Callback URL” field, use `http://localhost:3000/auth/twitter/callback`.

### Running locally

1. Clone the project
`git clone https://github.com/nickrttn/twitter-dataviz.git && cd twitter-dataviz`
2. Create an `.env` file and insert the Twitter API key and secrets, as well as a session secret.
`cp .env-example .env && subl .env` (replace `subl` with your favorite editor)
2. Run the Docker containers
`docker-compose up -d`
3. Install dependencies
`npm install`
4. Build the client-side assets
`npm run build`
5. Start the application
`npm run start`

### Working on this application

- Start the application with `npm run start:dev`
- Run `npm run watch` while developing to automagically build your client-side assets

## Deployment

The repository includes a sample `ecosystem.json` file for PM2. To use it, you would need a VPS with Node.js (v7+) installed, PM2 set up, Redis and MongoDB. You'll probably also want to set up SSH for easy deployment and better security. Send me a tweet at https://twitter.com/nickrttn or [create an issue](https://github.com/nickrttn/twitter-dataviz/issues/new) and I'll point you in the right direction.

I deployed my instance of the application to a Digital Ocean box running Node.js, PM2 and Redis, with a remote MongoDB on the MongoDB Atlas cloud.

Deploy by running `npm run deploy`.

## API documentation

Express.js exposes six HTTP endpoints.

- `GET /`
The root of the web application, asking the user to sign in with Twitter.
- `GET /dataviz`
After signing in, a user is redirected here to pick a visualisation form.
- `GET /dataviz/map`
The interactive map with tweets streamed in real-time. Filterable by trending topics, colored by tweet sentiment.
- `GET /dataviz/colors`
Generative art, based on the profile colors of Twitter users
- `GET /auth/twitter/signin`
A route used by the Twitter oAuth service to authenticate the user.
- `GET /auth/twitter/callback`
A route used by the Twitter oAuth service to authenticate the user.

In addition to Express, socket.io exposes two namespaces.

- `/map`  
`/map` emits events to the client
	- `place` a tweet with a location
	- `closestTrends` a list of trends based on the users' location
`/map` also listens for events from the client
	- `userLocation` the geo-location of a user
	- `filter` a user (de-)selects a filter
	- `filters` sync the filters after a reconnect

- `/colors`
`/colors` emits event to the client
	- `colors` an array of Twitter user profile colors

## Future nice to haves

- Make it work better on mobile and/or touch devices
- Visualise historic data (preferably without requiring gigantic amounts of database storage)
- Improve the offline experience by caching tweets
- Start a stream from an admin accessible page, so there's always one running
- Use it with Twitters' Decahose

## Contributing

I'm open to contributors. If you'd like to contribute, you can fork the repo, make your changes, and do a pull request. If you need ideas what to improve, you could take a look at the [nice to haves](#nice-to-haves).

## Uses

I listed the most notable packages below. For more info, take a look in [package.json](package.json)

- [Leaflet](http://leafletjs.com/) an open-source JavaScript library for mobile-friendly interactive maps.
Leaflet is used to display the map.
- [Leaflet.Terminator](https://github.com/joergdietrich/Leaflet.Terminator) a Leaflet plugin to show the solar terminator.
- [D3.js](https://github.com/d3/d3/wiki), a JavaScript library for visualizing data using web standards. Used for some geographic calculations and a color scale.
- [socket.io](https://socket.io/), an engine for real-time communication.

## License

MIT © [Nick Rutten](https://twitter.com/nickrttn)
