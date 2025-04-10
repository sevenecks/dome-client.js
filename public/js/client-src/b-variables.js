var dome = {};
var socket = null;

var defaultHeightOffset = typeof(specialHeightOffset) == 'undefined' ? 50 : specialHeightOffset;

var SOCKET_STATE_ENUM = {
    RECONNECT_FAILED : -1, // we tried a number of times and gave up
    DISCONNECTED :  0, // we lost connection
    CONNECTED :  1, // we have a connection
    BEFORE_FIRST :  2  // we have yet to try for a connection
};
