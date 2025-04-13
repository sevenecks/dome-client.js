dome.setupOutputParser = function() {

    // we use this object to load a local editor over several socket events
    var editor = {};
    var editorInit = function () {
        dome.activeEditor = editor = {
            readingContent: false,
            buffer:         '',
            editorName:     '',
            uploadCommand:  ''
        };
    };
    editorInit();

    dome.parseSocketData = function ( segment ) {
        var ts = new Date();
        // a segment is one or more lines
        // #$# edit name: Note: testing upload: @@set_note 12106
        if ( editor.readingContent ) {
            var terminalMarker = segment.lastIndexOf( '\n.\r' );
            if ( terminalMarker != -1 || (terminalMarker = segment.indexOf( '.\r\n' )) == 0 ) {
                editor.buffer += segment.substr( 0, terminalMarker );
                var spawned = dome.makeEditor( editor );
                if ( spawned ) {
                    dome.spawned[ editor.editorName ] = spawned;
                    dome.updateEditorListView();
                }
                editorInit();
                segment = segment.substr( terminalMarker + 4 );
            } else {
                editor.buffer += segment;
                segment = '';
            }
            if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( dome.statusDisplay, '<span class="warn">BUFFERING POPUP ...</span>' );
        }
        var meta = -1;
        if ( (meta = segment.indexOf( '#$#' )) == 0 || (meta = segment.indexOf( '\n#$#' )) > 0 ) {
            var end = segment.indexOf( '\r\n', meta );
            var metaCommand = segment.substr( meta, end - meta );
            var a = metaCommand.split( ' upload: ' );
            var uploadCommand = a[ a.length - 1 ];
            a = a[ 0 ].split( ' name: ' );
            var editorName = a[ a.length - 1 ];
            console.log(editorName);
            // adjust the substr based on the IF, index == 0 means pattern was 3, index > 0 means pattern was 4
            metaCommand = a[ 0 ].substr( meta == 0 ? 4 : 5 );
            if ( metaCommand == 'edit' ) {
                editorInit();
                var terminalMarker = segment.indexOf( '\n.\r', end );
                if ( terminalMarker != -1 ) {
                    dome.spawned[ editorName ] = dome.makeEditor( {
                        'editorName':    editorName,
                        'uploadCommand': uploadCommand,
                        'buffer':        segment.substr( end + 1, terminalMarker - end )
                    } );
                    dome.updateEditorListView();
                    segment = segment.substr( 0, meta ) + segment.substr( terminalMarker );
                } else {
                    // the rest of this will finish in another event
                    editor.readingContent = true;
                    editor.buffer += segment.substr( end + 1 );
                    editor.editorName = editorName;
                    editor.uploadCommand = uploadCommand;
                    segment = segment.substr( 0, meta ); // remove the start of the edit buffer from the segment
                }
            } else if ( metaCommand && metaCommand.indexOf( 'user' ) == 0 ) {
                // userType is global within closure
                dome.userType = a[ 0 ].substr( a[ 0 ].indexOf( 'user-type' ), 12 ).split( ' ' )[ 1 ];
                segment = segment.substr( 0, meta ) + segment.substr( meta + a[ 0 ].length );

                if (dome.setupAutoComplete && dome.inputReader) dome.setupAutoComplete( dome.inputReader, dome.userType );

            } else if ( metaCommand == '- PING!' ) {
                segment = segment.substr( 0, meta ) + segment.substr( meta + 13 );
                if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( dome.statusDisplay, 'pinged' );
            } else {
                if ( console ) {
                    if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( statusDisplay, metaCommand );
                    //console.log( 'unhandled meta command: ' + metaCommand );
                }
            }
            // end of #$# meta command reader
        }

        if ( dome.channel && (channelMatches = dome.channel.pattern.exec( segment )) ) {
            // we'll use this to attach some functionality to channels.
            if ( (channel = dome.channel.getChannel( channelMatches[ 2 ] )) != null ) {
                // we're supposed to filter this channel
                if ( channel[ 'window' ] ) {
                    channel.window.onChannelData( segment );
                } else {
                    channel = dome.channel.spawnChannel( channelMatches[ 2 ] );
                    window.setTimeout( function () {
                        channel.window.onChannelData( segment );
                    }, 1000 );
                }
                // we sent it to a channel!
                return;
            }
        }

        _.each( subs, function ( sub ) {
            segment = segment.replace( sub.pattern, sub.replacement );
        } );

        // make links clickable
        segment = segment.replace( urlRegex, function ( url ) {
            if ( url.indexOf( 'http' ) != 0 ) {
                url = 'http://' + url;
            }

            var out = '<a href="' + url + '" target="_blank">' + url + '</a>';
            var lowerURL = url.toLowerCase();
            var isImage = lowerURL.match( dome.urlPatterns.images );
            var isVideo = lowerURL.match( dome.urlPatterns.videos );
            var isYouTube = dome.parseYouTubeID( url );
            if ( isImage || isVideo || isYouTube ) {
                var imageId = 'i' + (new Date()).getTime() + 'x' + Math.floor( (Math.random() * 1000000) + 1 );

                out += '<i id="b' + imageId + '" class="icon-white icon-chevron-' + (dome.preferences.imagePreview ? 'down' : 'up') + '" aria-hidden="true" style="cursor: pointer" onclick="dome.toggleImage(this, \'' + imageId + '\', \'' + url + '\');"></i>';
                out += '<span id="s' + imageId + '">';
                if ( dome.preferences.imagePreview ) {
                    out += '<br><a href="' + url + '" target="_blank">';
                    if ( isVideo ) {
                        out += '<video class="shown-image" loop muted autoplay id="' + imageId + '" style="max-width: 75%">';
                        out += '<source type="video/mp4" src="' + url.replace(/gifv$/, 'mp4') + '">';
                        out += '</video>';
                    } else if ( isYouTube ) {
                        var width = Math.min( dome.buffer.width() - 20, 560 );
                        var height = Math.floor( width * 0.5652 );
                        out += '<iframe id="';
                        out += imageId;
                        out += '" class="shown-image" width="';
                        out += width;
                        out += '" height="';
                        out += height;
                        out += '" src="https://www.youtube.com/embed/';
                        out += isYouTube;
                        out += '" frameborder="0" allowfullscreen></iframe>';
                    } else {
                        out += '<img class="shown-image" id="' + imageId + '" src="' + url + '" style="max-width: 75%">';
                    }
                    out += '</a><br>';
                }
                out += '</span>';
            }

            return out;
        } );

        // make ips clickable, must be AFTER making links clickable
        segment = segment.replace( ip_regex, '<a href="https://whatismyipaddress.com/ip/$&" target="_new">$&</a>');

        // make obj#s have special spans for selection
        segment = segment.replace(/(\#\d+\b)/g,  '<span class="all-copy">$1</span>');
        // make $corified object references have special spans for selection
        segment = segment.replace(/(\$\w*)/g,  '<span class="all-copy">$1</span>');

        if ( dome.alert && dome.alert.active && dome.alert.pattern != null ) {
            if ( segment.match( dome.alert.pattern, 'i' ) ) {
                dome.alert.tone.play();
                dome.windowAlert();
            }
        }

        segment = segment.replace(/\n/g, '</div><br/><div>');

        dome.buffer.append( segment );

        var kidCount = dome.buffer.contents().length;
        var execDuration = (new Date()).getTime() - ts.getTime();
    
        if (execDuration > 1) {
            console.log('slow buffer ... buffer length: ' + kidCount + '  | duration: ' + execDuration);
        }

        if (dome.preferences.performanceBuffer > 0) {
            while(kidCount > dome.preferences.performanceBuffer) {
                dome.buffer.contents().first().remove();
                kidCount = dome.buffer.contents().length;
            }
        }

        if ( dome.pauseBuffer ) {
            dome.pausedLines++;
            if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( dome.statusDisplay, '' + dome.pausedLines + ' UNREAD LINES' );
        } else {
            dome.buffer.animate( { scrollTop: dome.buffer[ 0 ].scrollHeight }, 50 );
        }
    };
};
