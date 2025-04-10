var path = require( 'path' ),
    logger = require( '../lib/logger' ).named( 'routes/' + path.basename( __filename, '.js' ) );

var metrics = {
    '403' : {
        count: 0,
        urls: [],
        ips: []
    },
    '404' : {
        count: 0,
        urls: [],
        ips: []
    },
    '500' : {
        count: 0,
        urls: [],
        ips: []
    }
};

var serveError = function( status, req, res, page ) {
    metrics[status].count++;
    metrics[status].urls.push(page.url); // add to back
    metrics[status].ips.push(req.header('X-Forwarded-For'));
    console.log(metrics[status].urls.length);
    if (metrics[status].urls.length >= 20 ) {
        metrics[status].urls.shift(); // remove from front
        metrics[status].ips.shift();
    }
    res.status( status );
    res.render( 'errors/' + status, page );
};
 
var exports = module.exports;
exports.metrics = metrics;
exports.permissionDenied = function( req, res, next ) {
    var page = {
        title: 'Permission Denied',
        meta : {
            title: 'Permission Denied',
            description: 'Whoa! You can\'t just go using things without permission!',
            keywords: '403, Permission Denied'
        },
        url: req.url
    };
    console.dir(page);
    serveError( 403, req, res, page );
};

exports.notFound = function( err, req, res, next ) {
    if ( err && err.message == '404' ) {
        console.dir( err );
        var page = {
            title: 'File Not Found',
            meta: {
                title: 'Not Found',
                description: 'The file requested doesn\'t exist.',
                keywords: '404'
            },
            error : err,
            url: req.url
        };
        serveError( 404, req, res, page );
    } else if ( err ) {
        next( err );
    } else {
        next();
    }
};

exports.errorHandler = function( err, req, res, next ) {
    if ( err ) {
        logger.error( 'Unexpected Error Encountered from ' + req.url, err );
        var page = {
            title : 'Unexpected Error',
            meta : {
                title: 'Unexpected Error',
                description: 'Who really expects an error, anyway?',
                keywords: '500'
            },
            error : err,
            url: req.url
        };
        serveError( 500, req, res, page );
    } else {
	  var page = {
            title: 'File Not Found',
            meta: {
                title: 'Not Found',
                description: 'The file requested doesn\'t exist.',
                keywords: '404'
            },
            error : err,
            url: req.url
        };
        serveError( 404, req, res, page );
        next();
    }
};

exports.json = {};
exports.json.errorHandler = function( err, req, res, next ) {
    if ( !err ) {
        err = new Error( 'File Not Found' );
        err.code = 404;
    }

    logger.error( err );
    res.json( { 'status' : 'error', 'err' : err, 'message' : err.message }, err['code'] ? err.code : 500 );
};
