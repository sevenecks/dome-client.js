var path   = require( 'path' ),
    logger = require( '../lib/logger' ).named( 'routes/' + path.basename( __filename, '.js' ) ),
    fs     = require( 'fs' );


var AUTOCOMPLETE = {};
var ac = function(usertype, next) {
  if (AUTOCOMPLETE[usertype]) {
    next(null, AUTOCOMPLETE[usertype]);
  } else if ((usertype == 'p' && process.env.AUTOCOMPLETE_PLAYER) || (usertype == 'o' && process.env.AUTOCOMPLETE_GUEST)) {
      let filename = '';
      if (usertype == 'p') {
        filename = process.env.AUTOCOMPLETE_PLAYER;
    } else if (usertype == 'o') {
        filename = process.env.AUTOCOMPLETE_GUEST;
    }
    fs.readFile(filename, 'utf8', function( err, data ) {
      AUTOCOMPLETE[usertype] = data.split("\n");
      next(null, AUTOCOMPLETE[usertype]);
    });
  } else {
    next(null, []);
  }
};

var exports = module.exports;
exports.basic = function( req, res ) {
  ac(req.params.type, function( err, cmds) { res.json(cmds); });
};
