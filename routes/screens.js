var path   = require( 'path' ),
    fs     = require( 'fs' ),
    _  = require( 'underscore' );

var connected = {
  count: 0,
  games: {}
};

var whenConnected = function(address) {
  connected.count++;
  var key = address.host + ':' + address.port;
  key = key.toLowerCase();
  if (connected.games[key]) {
    connected.games[key]++;
  } else {
    connected.games[key] = 1;
  }
};

var connected = function() {
  return {
    count: connected.count,
    games: _.sortBy( _.map( connected.games, function ( count, game ) { return { address: game, count: count }; } ), 'count' ).reverse()
  };
};

var exports = module.exports;

exports.connect = function( req, res ) {
    console.log(connected())
    res.render( 'connect-as', { 
      'connectAnywhere': process.env.CONNECT_ANYWHERE == 'true' ? 1 : 0,
      'mooHostname': process.env.GAME_HOST,
      'mooPort': process.env.GAME_PORT,
      'stats': connected(),
      'meta' : {
       'title' : 'Connect - Modern Gaming Client',
       'description' : 'Connect to Sindome using its state of the art Modern Gaming Client. No flash, no plugins, just a modern browser. Play with your iPad or check in from the company computer. There\'s nothing to install.',
       'keywords' : 'moo-client, telnet client, modern gaming client, play sindome, text-based game, websocket-telnet'
      }
    });
};

exports.options = function( req, res ) {
  res.render( 'client-options', {
    'meta' : {
      'title' : 'Options - Modern Gaming Client',
      'description': 'Configure your preferred options when using our state of the art Modern Gaming Client.',
      'keywords': 'moo-client, client options, configure preferences, command hints, short urls, cheats'
    }
  });
};

exports.client = function( req, res ) {
  res.render( 'client', {
    'meta' : {
      'title' : 'Sindome\'s Modern Gaming Client',
      'description' : 'Someone playing Sindome via Sindome\'s Modern Gaming Client',
      'keywords' : 'moo-client, telnet client, modern gaming client, play sindome, text-based game, websocket-telnet'
    }
  });
};

exports.editor = function( req, res ) {
  var template = editorType = req.params.type;
  if ( editorType != "verb" && editorType != "note-viewer") {
    // only verb gets special support right now
    template = "basic";
  }
  res.render( 'editors/' + template, {
    editor : {
      'readonly' : req.params.type == "basic-readonly" ? true : false
    },
    'meta' : {
      'title' : 'Untitled Local Editor ',
      'description' : 'Local editor window for the Sindome Modern Gaming Client.',
      'keywords' : 'gaming client editor'      
    }
  });
}
