
dome.setupInputReader = function() {

    // prevent the backspace key from navigating away from the page
    $(document).on('keydown', function(e){
        if (e.keyCode == 35 && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        // 'end' key
        // enable / disable scroll
            dome.onToggleAutoScroll();
            return;
        } else if (e.keyCode == 36 && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            // home
        // return the focus to the input reader
            dome.inputReader.focus();
            return;
        } else if (e.keyCode == 45 && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        // insert key
        // this code allows you to pop open a window to send a command to the MOO
        // it's useful when you have a bunch of stuff typed out in your normal text input
            var fast_command = prompt('Please enter command to send:', '');
            if (fast_command != null && fast_command != '') {
            // WARNING: This code below is a copy paste of the code used when hitting enter on the inputBuffer
            // It will need to be kept in line with that code, or both sets should be extracted into a function
            // -- Slither 07/08/23
                socket.emit( 'input', fast_command, function ( state ) {
                    if ( dome.preferences.localEcho ) {
                        dome.buffer.append( '<span class="input-echo">&gt;' + fast_command + '</span>\n' );
                    }
                    if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( dome.statusDisplay, (state.status && state.status.indexOf( 'command sent' ) == 0) ? 'SENT' : state.status, false );
                    if (fast_command && fast_command.indexOf('@client-option') == 0) {
                        if (dome.parseClientOptionCommand) dome.parseClientOptionCommand(fast_command);
                    }
                });
            }
        }
        var elid = $(document.activeElement).is('input:focus, textarea:focus');
        if(e.keyCode === 8 && !elid){
            return false;
        }
    });

    var lastInput   = '';
    var commandBuffer  = store.get('my-input-buffer') || [];
    var commandPointer = commandBuffer.length || -1;

    var getCursorPosition = function(textarea) {
        if ('selectionStart' in textarea) {
            return {
                start: textarea.selectionStart,
                end: textarea.selectionEnd
            };
        } else {
            // really just IE
            return { start: 1, end: 1 };
        }
    };

    if ( dome.inputReader ) {
        var inputReader = dome.inputReader;
        inputReader.on( 'keydown', function ( event ) {
            if ( event.which == 38 && commandPointer >= 0 ) {
                // up (show next oldest)
                var cursor = getCursorPosition( inputReader[ 0 ] );
                if ( cursor.start != cursor.end ) {
                    // text is selected
                } else {
                    if ( cursor.start < 150 ) {
                        // is the cursor 'near' the top
                        commandPointer = ( commandPointer <= -1 ? commandBuffer.length : commandPointer ) - 1;
                        inputReader.val( commandBuffer[ commandPointer ] );
                        event.preventDefault();
                    } else {
                        // let the cursor move up, hopefully?
                    }
                }

                return false;
            } else if ( event.which == 40 && commandPointer < commandBuffer.length - 1 ) {
                // down (show next newest)
                commandPointer = ( commandPointer + 1 > commandBuffer.length ? 0 : commandPointer) + 1;
                inputReader.val( commandBuffer[ commandPointer ] );
                event.preventDefault();
                return false;
            } else if ( event.which == 40 && commandPointer >= commandBuffer.length - 1 ) {
                // down (at last, don't show me anything)
                commandPointer = commandBuffer.length;
                if ( inputReader.val() == lastInput && inputReader.val() != '' ) {
                    // clear the buffer but don't forget what was in it
                    // but dont add blank lines for each down when there is nothing there
                    commandBuffer[ commandBuffer.length ] = inputReader.val();
                    if ( commandBuffer.length > 2e3 ) {
                        commandBuffer.shift();
                    }
                    commandPointer = commandBuffer.length;
                    store.put( 'my-input-buffer', commandBuffer );
                    inputReader.val( '' );
                    lastInput = '';
                } else {
                    inputReader.val( lastInput );
                }
                event.preventDefault();
                return false;
            }
        } );
        inputReader.on( 'keypress', function ( event ) {
            if ( event.which == 8 ) {

            }
            if ( event.which == 13 && !event.shiftKey ) {
                if (dome.autoComplete) {
                    try {
                        inputReader.commandSuggestions( 'close' );
                    } catch (e) {
                        console.log(e);
                    }
                }
                // enter key
                event.preventDefault();
                var command = inputReader.val();

                socket.emit( 'input', command, function ( state ) {
                    if ( dome.preferences.localEcho ) {
                        dome.buffer.append( '<span class="input-echo">&gt;' + command + '</span>\n' );
                    }
                    if (dome.setFadeText && dome.statusDisplay) dome.setFadeText( dome.statusDisplay, (state.status && state.status.indexOf( 'command sent' ) == 0) ? 'SENT' : state.status, false );

                    if (command && command.indexOf('@client-option') == 0) {
                        if (dome.parseClientOptionCommand) dome.parseClientOptionCommand(command);
                    }
                });

                commandBuffer[ commandBuffer.length ] = inputReader.val();
                if ( commandBuffer.length > 2000 ) {
                    commandBuffer.shift();
                }
                commandPointer = commandBuffer.length;
                store.put( 'my-input-buffer', commandBuffer ); // localStore deals in strings, this won't work as an array Chad. - Future Chad
                inputReader.val( '' );
                return false;
            } else {
                setTimeout( function () {
                    lastInput = inputReader.val();
                }, 5 );
            }
        } );
        inputReader.on( 'focus', function () {
            //console.log('focused on the input reader');
        } );
    }
};
