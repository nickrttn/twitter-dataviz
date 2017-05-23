# Tweets in real-time

This application visualizes tweets as they come in. If a tweet includes a location or mentions a place, it is shown on a map. The application consumes the Twitter Streaming API. Twitter streams 1% of their 500 million tweets to the server as they come in. In an alternative visualization, the profile colors of every tweets' user are shown.

## Features

- oAuth 1.0 authentication
- Pub/sub to the Twitter Streaming API using a NodeJS EventEmitter
- Socket.io WebSockets or long polling, depending on the capabilities of the client
- Data visualization using D3.js geo libraries
- Error handling

## API documentation

The web application exposes six endpoints.

- `/`
- `/dataviz`
- `/dataviz/map`
- `/dataviz/colors`
- `/auth/twitter/signin`
- `/auth/twitter/callback`



## Uses

- World map data from [Natural Earth Data](www.naturalearthdata.com)
- an orthographic map projection
- http://samherbert.net/svg-loaders/
- d3-geo
- leaflet
- leaflet.terminator
- socket-io

