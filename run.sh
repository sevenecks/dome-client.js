#!/bin/bash
rm -f public/css/client.css
rm -f public/js/player-client.js
rm -f public/js/player-client.min.js
./node_modules/uglify-js/bin/uglifyjs public/js/client-src/*.js -b --comments --output public/js/player-client.js
./node_modules/uglify-js/bin/uglifyjs public/js/player-client.js -c --output public/js/player-client.min.js

GIT_HASH=$(git log --format="%H" --max-count=1 less/*)
export GIT_HASH=$GIT_HASH
node client-app.js $GIT_HASH
