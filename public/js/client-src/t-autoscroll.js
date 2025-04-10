dome.setupAutoscroll = function() {
    dome.pauseBuffer = false;
    dome.pausedLines = 0;

    var longClickProc = null;
    dome.onToggleAutoScroll = function ( event ) {
        longClickProc = null; // clears the process variable if this was a long click
        window.getSelection().removeAllRanges();
        var button = dome.scrollButton;
        if ( dome.pauseBuffer ) {
            dome.pauseBuffer = false;
            dome.pausedLines = 0;
            if (dome.setFadeText) dome.setFadeText( dome.statusDisplay, 'SCROLLING RESUMED' );
            dome.buffer.animate( { scrollTop: dome.buffer[ 0 ].scrollHeight }, 50 );
            dome.buffer.removeClass( 'scroll-disabled' );
            button.html( '<i class="icon-pause icon-white" aria-hidden="true"></i><span class="hidden-xs">PAUSE SCROLL</span>' );
            button.addClass( 'btn-primary' );
            button.removeClass( 'btn-danger' );
            // give the focus to the inputBuffer
            $('#inputBuffer').trigger("focus");
        } else {
            dome.pauseBuffer = true;
            if (dome.setFadeText) {
                dome.setFadeText( dome.statusDisplay, 'SCROLLING PAUSED' );
            }
            dome.buffer.addClass( 'scroll-disabled' );
            button.html( '<i class="icon-play icon-white" aria-hidden="true"></i><span class="hidden-xs">RESUME SCROLL</span>' );
            button.addClass( 'btn-danger' );
            button.removeClass( 'btn-primary' );
            // give the focus to the lineBuffer
            $('#lineBuffer').trigger("focus");
        }
    };

    if (dome.preferences.autoScroll == 'dbl') {
        dome.buffer.on( 'dblclick', dome.onToggleAutoScroll );
    } else if (dome.preferences.autoScroll == 'long') {
    // long click support is available here
        dome.buffer.on( 'mousedown', function ( event ) {
            longClickProc = window.setTimeout( dome.onToggleAutoScroll, 2000 );
        } );
        dome.buffer.on( 'mouseup', function ( event ) {
            if ( longClickProc != null ) {
                window.clearTimeout( longClickProc );
            }
            longClickProc = null;
        } );
    } else if (dome.preferences.autoScroll == 'none') {
        // fuck this we ain't need no gorram mousess baka
    }
};
