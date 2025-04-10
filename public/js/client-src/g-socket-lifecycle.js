
dome.setupSocket = function() {
    var onDisconnectedHandler = function() {
        console.log('disconnected');
        if (dome.socketState != SOCKET_STATE_ENUM.CONNECTED) {
            console.log('disconnected before we connected!');
        }
        dome.socketState = SOCKET_STATE_ENUM.DISCONNECTED;
        if (dome.activeEditor) {
            dome.activeEditor.readingContent = false;
        }
        if ( dome.setFadeText && dome.statusDisplay ) dome.setFadeText(dome.statusDisplay, 'DISCONNECTED', true);
        dome.disconnectView.overlay.removeClass('hide');
        dome.disconnectView.buttonGroup.removeClass('hide');
    };
    var onReconnectHandler = function() {
        dome.disconnectView.overlay.addClass('hide');
        dome.disconnectView.buttonGroup.addClass('hide');
    };
    var onReconnectFailedHandler = function() {
        dome.socketState = SOCKET_STATE_ENUM.RECONNECT_FAILED;
        dome.disconnectView.overlay.removeClass('hide');
        dome.disconnectView.buttonGroup.removeClass('hide');
    };

    var initialCommand = false;
    var onConnectedHandler = function() {
        if (dome.socketState == SOCKET_STATE_ENUM.DISCONNECTED) {
            onReconnectHandler();
        }
        dome.socketState = SOCKET_STATE_ENUM.CONNECTED;
        if (dome.inputReader) dome.inputReader[0].focus(); // focus the cursor in the input field
        if (dome.setFadeText && dome.statusDisplay) dome.setFadeText(dome.statusDisplay, 'CONNECTED');
    
        if (!initialCommand)
            setTimeout(function() {
                // delayed input to account for latency
                var cmd;
                if ((cmd = store.get('dc-initial-command'))) {
                    // guest login
                    if (dome.setWindowTitle) dome.setWindowTitle('Guest | ' + gameName + ' | ' + poweredBy);
                    dome.socket.emit('input', cmd, function() {
                        store.remove('dc-initial-command');
                    });
                } else if ((cmd = store.get('dc-user-login'))) {
                    // user login
                    var who = store.get('last-username');
                    dome.alert.pattern = new RegExp(who);
                    if (dome.setWindowTitle) dome.setWindowTitle(who + ' | ' + gameName + ' | ' + poweredBy);
                    dome.socket.emit('input', cmd, function() {
                        //
                    });
                }
                if (dome.preferences.shortenUrls) {
                    dome.socket.emit('shorten-on', 'shorten-on', function() { if (console) { console.log('enabling short urls'); } });
                }
            }, 2000);
        initialCommand = true;
    };

    socket = io.connect(('https:' == document.location.protocol ? socketUrlSSL : socketUrl), {
        'query' : 'host=' + dome.gameHostname + '&port=' + dome.gamePort,
        'sync disconnect on unload' : true // send 'disconnect' event when the page is left
    });

    socket.on('connected', function( data ) {
        onConnectedHandler();
    });
    socket.on('disconnected', function( data ) {
        onDisconnectedHandler();
    });
    socket.on('reconnect_failed', function( data ) {
        onReconnectFailedHandler();
    });
    socket.on( 'error', function(e) {
        if (dome.onErrorHandler) dome.onErrorHandler(e);
    });
  
    return socket;
};
