var
  path   = require( 'path' ),
  logger = require( '../lib/logger' ).named( 'routes/' + path.basename( __filename, '.js' ) );

exports.log = function( req, res ) {
  logger.info( 'generating log for ' + req.ip );
  res.setHeader( 'Content-disposition', 'attachment; filename=' + req.params.filename );
  res.setHeader( 'Content-type', 'text/html' );
  res.write( '<html><head><title>Web Client Buffer</title>');
  res.write( '<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Source+Code+Pro|Quantico:400,400italic,700">' );
  res.write( '<base href="http://play.sindome.org">' );
  res.write( '<link rel="stylesheet" type="text/css" href="http://www.sindome.org/css/dome.css">' );
  res.write( '<link rel="stylesheet" tyle="text/css" href="http://play.sindome.org/css/client.css">' );
  res.write( '</head><body><div id="browser-client"><div id="lineBuffer">' );
  res.write(req.body.buffer);
  res.write( '</div></div></body></html>' );
  res.end();
};
