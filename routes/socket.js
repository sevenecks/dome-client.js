var net = require( 'net' ),
    dns = require( 'dns' ),
   path = require( 'path' ),
     _  = require( 'underscore' ),
   ua   = require( 'useragent' ),
 logger = require( '../lib/logger' ).named( 'routes/' + path.basename( __filename, '.js' ) ),

exports = module.exports;

exports.error = function( err, arg2, arg3 ) {
  logger.error( err );
  logger.debug( 'args:' );
  logger.inspect( arguments );
};

var SOCKET_PROXIED = _.has( process.env , 'SOCKET_PROXIED' ) ? process.env.SOCKET_PROXIED : false;


var userIp = function( socket ) {
  //logger.debug(socket.handshake);

  var handshakeAddress = socket.handshake.address;
  if ( typeof( handshakeAddress ) === 'object' && _.has( handshakeAddress, 'address' ) ) {
    handshakeAddress = handshakeAddress.address;
  }

  var tempAddress = SOCKET_PROXIED ? ( socket.handshake.headers[ 'x-forwarded-for' ] || handshakeAddress ) : handshakeAddress;
  // because of ipv6 being preferred or something, we get ipv4 addresses in ipV6 format. this breaks @dome-client-user
  return tempAddress.replace('::ffff:', '');
};

var logUser = function( socket, label, moreFields ) {
  var isError = ( typeof( label ) === 'object' && ( _.has( label, 'message' ) || _.has( label, 'code' ) ) );
  var fieldset = [
    ( isError ? 'ERR' : (label || '') ),
    userIp( socket )
  ];
  if ( moreFields && moreFields.length ) fieldset = fieldset.concat( moreFields );
  var msg = fieldset.join( ' ' );
  isError ? logger.error( msg, label ) : logger.info( msg );
};

var logError = function( socket, err ) {
  var userAgent = ua.parse( socket.handshake.headers[ 'user-agent' ] );
  logUser( socket, err, [
    userAgent.toAgent(),
    userAgent.os.toString(),
    socket.handshake.headers.referer,
    ( userAgent.device && userAgent.device.toString() !== 'Other 0.0.0' ? userAgent.device.toString() : '' ),
    err.message || err.code || ''
  ]);
};

// browser connecting via websocket
exports.connection = function ( socket ) {
  // open a network connection to the moo
  // updated for socket io 1.7.4
  socket.isActive = true;
  var gameHost = '';
  var gamePort = '';
  if (socket.handshake['query'] && socket.handshake.headers['host']) {
    gameHost = socket.handshake.headers.host;
  }
  if (socket.handshake['query'] && socket.handshake.headers['port']) {
    gamePort = socket.handshake.headers.port;
  }
    console.log('HOST AND PORT: ', gameHost, gamePort)

  if (gameHost) {
    socket.gameAddress = { host: gameHost, port: gamePort };
  }
  // open a network connection to the moo
  var moo = net.connect( { 'port' : process.env.GAME_PORT, 'host' : process.env.GAME_HOST }, function(err) {
    // tell the other end of the connection that it connected successfully
    if ( err ) {
      logger.error( 'error while connecting to moo' );
      logError( socket, err );
      socket.emit( 'error', err.toString());
      return;
    }
  });

  moo.on( 'connect', function( data ) {
    var address = userIp( socket );
    var userAgent = ua.parse( socket.handshake.headers[ 'user-agent' ] );
    logUser( socket, 'HI ', [
      userAgent.toAgent(),
      userAgent.os.toString(),
      socket.handshake.headers.referer,
      ( userAgent.device && userAgent.device.toString() !== 'Other 0.0.0' ? userAgent.device.toString() : '' )
    ]);
    // set a property on the socket that will stick around.
    // We'll overwrite it with an actual hostname if one gets resolved
    socket.hostname = address;

    var dnsErrorHandler = function( err ) {
      if ( err.code === 'ENOTIMP' ) {
        logger.debug( 'reverse dns not implemented' );
      } else if ( [ 'NOTFOUND', 'SERVFAIL', 'TIMEOUT' ].includes( err.code ) ) {
        logUser( socket, 'DNS', [ err.code ] );
      } else {
        logger.error('exception while resolving name for ip ' + address );
        logError( socket, err );
      }
    };

      try {
        dns.reverse( address, function ( err, domains ) {
          if ( err ) {
            dnsErrorHandler( err );
          } else if ( domains && domains.length ) {
            // now that we got a hostname, overwrite the ip address with that
            socket.hostname = domains[ 0 ];
            logUser( socket, 'DNS', [
              socket.hostname,
              ( userAgent.device && userAgent.device.toString() !== 'Other 0.0.0' ? userAgent.device.toString() : '' )
            ]);
          }
        });
      } catch ( err ) {
        dnsErrorHandler( err );
      }
    socket.isActive = true;
    // socket.set( 'is-active', true );
    socket.emit( 'connected', ( new Date() ).toString() );
  });

  // ** when receiving data from the moo
  moo.on( 'data', function( data ) {
    try {
      data = data.toString();
      if ( ( marker = data.indexOf( '#$# dome-client-user' ) ) != -1 ) {
        var end = data.indexOf( "\r\n", marker );
        // server wants to know the current remote address
        moo.write( "@dome-client-user " + ( _.has( socket, 'hostname' ) ? socket.hostname : userIp( socket ) ) + "\r\n", "utf8" );
      } else {
        var transmit = function( err, output ) {
          if ( socket.isActive ) {
            socket.emit( 'data', output );
          }
        };
        transmit( null, data );

      }
    } catch ( e ) {
      logger.error( 'exception caught when receiving data from the moo', e );
    }
  });

  moo.on( 'end', function( ) {
    logger.debug('moo connection sent end');
      if ( socket.isActive ) {
        logger.debug('socket is active, sending disconnect and marking inactive');
        socket.isActive = false;
        socket.emit( 'disconnected' );
      } else {
        logger.debug('socket is no longer active');
      }
  });

  moo.on( 'error', function( e ) {
    logger.error( 'moo error event occurred' );
    logError( socket, e );
      if ( socket.isActive ) {
        socket.emit( 'error', e );
      }
  });
  
  socket.on( 'error', function( e ) {
    logger.error( 'socket error event occurred' );
    logError( socket, e );
    // can't send this to the user 
  });
  
  socket.on( 'disconnect', function( data ) {
    logUser( socket, 'BYE' );
    if (!socket.isActive) return;
    socket.isActive = false;
    if (data) {
      logger.debug( 'disconnected from client: ' + data );
    }

    if (!moo.socketQuit)
    moo.write( '@quit' + "\r\n", "utf8", function() {
      //moo.end();
    });
  });
  
  // ** when receiving input from the websocket connected browser
  socket.on( 'input', function( command, inputCallback ) {
    if ( command == null ) {
      // event received, but null or empty string
      return inputCallback( new Error( 'no input' ) );
    }

    if ( command.indexOf('connect ') != -1 || command.indexOf('co ') != -1 ) {
      // possibly id the character being connected
      if (charmatch = command.match( /(connect|co) (\w+) \w/)) {
        var charname = charmatch[charmatch.length-1];
        // log some useful information for troubleshooting
        logUser( socket, 'USR', [ charname ] );
      }
    }

      // write the command to the moo and finish with a line break
      try {
        moo.write( command + "\r\n", "utf8", function() {
          // we emit a status event back to the browser to confirm we've done our job

          if ( command.match(/^@quit(\r\n)?$/)) {
            moo.socketQuit = true;
            socket.isActive = false;
            moo.end();
            socket.emit( 'disconnected' );
          } else {
            // don't send status when we're disconnecting to avoid an error
            socket.emit( 'status', 'sent ' + command.length + ' characters' );
          }
        });
        if (inputCallback) inputCallback( { 'status' : 'command sent from ' + config.node.poweredBy + ' to moo at ' + (new Date()).toString() } );
      } catch ( exception ) {
        logger.error( 'exception while writing to moo' );
        logger.error( exception.stack );
        if ( socket.isActive ) {
          socket.emit( 'error', exception );
        }
      }
  });
};
