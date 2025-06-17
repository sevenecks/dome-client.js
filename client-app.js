/** General Requires **/
require('dotenv').config()

const path = require('node:path'); 
const CONSTANTS  = require('constants');
const logger     = require( './lib/logger' ).named('client-app');
const io         = require( 'socket.io' );
const fs         = require( 'fs' );
const http       = require( 'http' );
const https      = require( 'https' );
const express    = require( 'express' );

/** Express Middleware **/
const cookieParser = require('cookie-parser');
const session = require('express-session');
const express_logger = require('morgan');
const bodyParser = require('body-parser');
const lessMiddleware = require('less-middleware');
const responsive = require('express-responsive');

/** Express Routes **/
const routes     = {
    'autocomplete' : require( './routes/autocomplete' ),
    'screens'      : require( './routes/screens' ),
    'socket'       : require( './routes/socket' ),
    'save'         : require( './routes/save' ),
};

/** Constants **/
const versionHash = process.env.GIT_HASH || ('t' + (new Date()).getTime());

/** Build Express & Start the HTTP Server **/
const app        = express();
const server  = http.createServer( app );
const httpMgr = io.listen( server, function() {
    logger.info('socket.io listening to http');
} );
let httpsMgr = undefined; // defined outside if so it exists beyond the scope of the if
let sslServer = undefined; // defined outside if so it exists beyond the scope of the if

/** Figure out if we're using SSL or not **/
if ( process.env.SSL_PORT ) {
    const sslOptions = {
        key  : fs.readFileSync(process.env.SSL_KEY),
        cert : fs.readFileSync(process.env.SSL_CERT)
    };
  
    if ( process.env.SSL_CA ) {
        sslOptions['ca'] = fs.readFileSync(process.env.SSL_CA);
    }

    if ( process.env.SSL_PASSPHRASE ) {
        sslOptions['passphrase'] = process.env.SSL_PASSPHRASE;
    }

    sslServer = https.createServer( sslOptions, app );
    httpsMgr  = io.listen( sslServer, sslOptions, function() {
        logger.info('socket.io listening to https');
    } );
}

/** Setup logging: 3 is debug, 2 is info **/
// httpMgr.set('log level', ( process.env.ENVIRONMENT == 'production' ? 1 : 2 ) );
if ( process.env.SSL_PORT ) {
    // httpsMgr.set('log level', ( process.env.ENVIRONMENT == 'production' ? 1 : 2 ) );
}

/** Setup Express **/
app.set( 'views', __dirname + '/views' );        // where to find the templates for pages
app.set( 'view engine', 'ejs' );                 // format the templates are in
app.set( 'cachingHash', versionHash );
app.set('version', '3.0.0');

/** Setup Express Middleware **/
app.use(express_logger('dev'));                  // setup the logger (morgan)

app.use( function (req, res, next ) {
    res.header( 'X-Powered-By', process.env.POWERED_BY );
    next();
});

// define req.device as one of desktop tablet phone tv bot
// It will assume desktop if no user agent string is given,
// and fallback to phone if the user agent string is unknown.
app.use(responsive.deviceCapture());
	
app.use(cookieParser());

/** This is used by the /save route to parse the data send from the client as part of submitting the 'log' form
 * and then dumping it back to the user as a file to download **/
app.use(bodyParser.urlencoded({ 
    extended: false,
    limit: '50mb'
}));
  
app.use(session({ 
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));

app.use( function( req, res, next ) {
    /** attach a number of values to the app.locals so they're available when we render a template
    * note that its better to attach a function if the majority of pages will not need the values
    * the function might return **/
    res.locals.socketUrl    = process.env.SOCKET_URL,
    res.locals.socketUrlSSL = process.env.SOCKET_URL_SSL,
    res.locals.req          = req,
    res.locals.debugMode    = process.env.ENVIRONMENT == 'production' ? false : true,
    res.locals.session      = req.session,
    res.locals.decache      = function(url) { return '' + url + '?' + app.get('cachingHash'); },
    res.locals.version      = app.get( 'version' ),
    res.locals.poweredBy    = process.env.POWERED_BY,
    res.locals.gameName     = process.env.GAME_NAME,
    res.locals.mainWebsite  = process.env.GAME_WEBSITE,
    res.locals.showReporter = function(req) { 
        let ua = req.headers['user-agent'];
        if (ua && ua.match('MSAppHost')) {
            // windows 8 app
            return false;
        }
        return true;
    };
    next();
});
    
// if the request was for CSS, this will compile the less into css and return it
// note that when node is proxied behind apache, the CSS file may not be compiled naturally
// in this situation, request the CSS url directly from the node port to force it to be compiled
app.use(lessMiddleware(path.join(__dirname, 'less'), {
    dest: path.join(__dirname, 'public'), 
    // lessMiddleware looks in the /less/css directory since the url is /css/ so we need to remove that, as our less
    // is in /less by itself. See: https://github.com/emberfeather/less.js-middleware/wiki/Examples
    preprocess: {
        path: function(pathname, req) {
            return pathname.replace(path.sep + 'css' + path.sep, path.sep);
        }
    },
    // debug can be turned off if you don't want it in the logs
    debug: false,
}));
	
app.use( express.static( path.join( __dirname, 'public' ), { dotfiles: 'allow' } ) );
  
// load the player version of the autocomplete file to 
fs.readFile( process.env.AUTOCOMPLETE_PLAYER, function( err, data ) {
    if ( err ) {
        logger.error( 'error while checking for autocomplete file ', err );
    }
    app.set('autocomplete');
    var vDesc = 'dome-client.js v' + app.get('version');
    if ( process.env.IP ) {
        // we'll listen to a specific ip for new connections
        server.listen( process.env.PORT, process.env.IP, function() {
            logger.info( vDesc +  ' (node ' + process.version + ') listening on ip ' + process.env.IP + ' and port ' + process.env.PORT);
        });
      
        if ( process.env.SSL_PORT ) {
            sslServer.listen( process.env.SSL_PORT, process.env.IP, function() {
                logger.info( vDesc +  ' (node ' + process.version + ') listening on ip ' + process.env.IP + ' and port ' + process.env.SSL_PORT );
            });
        }
    } else {
        // no specific ip, we'll listen to all of them
        server.listen( process.env.PORT, function() {
            logger.info( vDesc + ' (node ' + process.version + ') listening on port ' + process.env.PORT );
        } );
      
        if ( process.env.SSL_PORT ) {
            sslServer.listen( process.env.SSL_PORT , function() {
                logger.info( vDesc + ' (node ' + process.version + ') listening on port ' + process.env.SSL_PORT);
            });
        }
    }
});

httpMgr.sockets.on( 'connection', function (socket) {
    routes.socket.connection(socket, httpMgr);
});

httpMgr.sockets.on( 'error', routes.socket.error );

if ( process.env.SSL_PORT ) {
    httpsMgr.sockets.on( 'connection', routes.socket.connection );
    httpsMgr.sockets.on( 'error', routes.socket.error );
}

process.on('uncaughtException', function (err) {
    logger.error('uncaught exception', err);
});

/** Define the general routes **/
app.get( '/', routes.screens.connect );                // Connection Screen
app.post( '/', routes.screens.connect );
app.get( '/client-options/', routes.screens.options ); // Options Screen
app.get( '/player-client/', routes.screens.client );   // Game Client Screen
app.get( '/editor/:type(basic|basic-readonly|verb|note-viewer)/', routes.screens.editor );  // Editor Windows
app.get( '/ac/:type(p|j|a|c|w|o)', routes.autocomplete.basic );        // Fetch autocomplete terms
/** Handle client side logs **/
app.post( '/save/:filename', routes.save.log );
