dome.setupWindowHandlers = function() {

    dome.alert = {
        tone       : new Audio('/notice.wav'),
        pattern    : null,
        active     : false,
        titleProc  : null
    };

    dome.urlPatterns = {
        images: /png|jpg|gif|jpeg$/,
        videos: /mp4|gifv$/,
        youtube: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
    };

    dome.parseYouTubeID = function ( url ) {
        var match = url.match(dome.urlPatterns.youtube);
        return (match&&match[7].length==11)? match[7] : false;
    };

    var onUnloadHandler = function() { if (dome.socketState == SOCKET_STATE_ENUM.CONNECTED) socket.emit('input', '@quit\r\n'); };

    var onFocusHandler = function() {
        dome.alert.active = false;
        if (dome.alert.titleProc != null) {
            window.clearInterval(dome.alert.titleProc);
            dome.alert.titleProc = null;
            document.title = dome.titleBarText;
        }
        if (dome.inputReader) {
            dome.inputReader.trigger("focus");
        }
    };

    dome.setWindowTitle = function(newTitle) {
        document.title = dome.titleBarText = newTitle;
    };

    var onBlurHandler = function() { if (dome.preferences.playDing) dome.alert.active = true; };

    var defaultHeightOffset = typeof(specialHeightOffset) == 'undefined' ? 50 : specialHeightOffset;
    var onResizeHandler = function() {
        dome.client.css('height', '' + (window.innerHeight) + 'px');
        dome.buffer.css('height', '' + (window.innerHeight - defaultHeightOffset) + 'px');
    };

    var inViewport = function(jqElem) {
        var win = $(window);

        var viewport = {
            top : win.scrollTop(),
            left : win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();

        var bounds = jqElem.offset();
        bounds.right = bounds.left + jqElem.outerWidth();
        bounds.bottom = bounds.top + jqElem.outerHeight();

        return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
    };

    var onScrollHandler = function() {
        var shownImages = $( '.shown-image', dome.buffer );
        if ( shownImages && shownImages.length ) {
            shownImages.each( function ( idx, imageElem ) {
                var image = $(imageElem);
                if ( !inViewport( image ) ) {
                    var imageId = image.attr( 'id' );
                    var control = $( '#b' + imageId );
                    control.removeClass( 'icon-chevron-down' );
                    control.addClass( 'icon-chevron-up' );
                    var span = $( 'SPAN#s' + imageId, dome.buffer );
                    span.html( '' );
                }
            } );
        }
    };

    var titleAlerted = false;
    var alertTitle = function() {
        if (!titleAlerted) {
            document.title = '!! ' + dome.titleBarText;
            titleAlerted=true;
        } else {
            document.title = dome.titleBarText;
            titleAlerted=false;
        }
    };

    dome.windowAlert = function() {
        if (dome.alert.titleProc != null) {
            return;
        }

        dome.alert.titleProc = window.setInterval(alertTitle, 500);
    };


    // this is needed because the 'resize' event fires inappropriately in iOS
    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

    var winJQ = $(window);
    winJQ.on('focus', onFocusHandler);
    winJQ.on('blur', onBlurHandler);
    if (!iOS) {
        winJQ.on('resize', onResizeHandler);
    }
    winJQ.on('orientationchange', onResizeHandler);
    winJQ.on('unload', onUnloadHandler);
    dome.buffer.on('scroll', onScrollHandler);

    onResizeHandler();
};
