$.widget( 'custom.commandSuggestions', $.ui.autocomplete, {
    _renderItem: function( ul, item ) {
        return $( '<li>' )
            .data('item.autocomplete', item )
            .data('custom-commandSuggestions', item)
            .attr( 'data-value', item.value )
            .addClass('ui-menu-item')
            .append( item.display )
            .appendTo( ul );
    },
    _resizeMenu: function() {
        var bestWidth = Math.min(dome.buffer.width() - 20, 800);
        this.menu.element.outerWidth( bestWidth );
    }
});

dome.autoCommands = [];
dome.autoComplete = function() {

    var commandArgumentPattern = new RegExp( /<[-A-Z a-z]+>/, 'g' );
    var prettyCommandArguments = function ( unformattedString ) {
        return _.reduce( unformattedString.match( commandArgumentPattern ), function ( out, commandArg ) {
            return out.replace( commandArg, '<i>&lt;' + commandArg.substring( 1, commandArg.length - 1 ) + '&gt;</i>' );
        }, unformattedString );
    };
    dome.autoCommands = [];
    dome.setupAutoComplete = function ( inputBuffer, userType ) {
        if ( inputBuffer == null || (window.location.query && window.location.query.indexOf( 'ac=no' ) != -1) ) {
            // ?ac=no means no autocomplete
            return;
        }
        if ( dome.autoCommands.length > 0 ) {
            // if we previously setup with the basic set, destroy that autocomplete
            inputBuffer.commandSuggestions( 'destroy' );
        }
        $.ajax( {
            url:      '/ac/' + userType,
            dataType: 'json',
            success:  function ( data ) {
                dome.autoCommands = _.reduce( data, function ( out, line ) {
                    var commandValue = line.trim();
                    var commandSearch = commandValue;
                    var commandHelp = '<div class="command-syntax">' + commandValue + '</div>';
                    var parts = commandValue.split( '|' );
                    if ( parts.length > 1 ) {
                        commandValue = parts[ 0 ].trim();
                        var commandSyntax = commandSearch = commandValue;
                        var commandParts = commandValue.split( ' ' );
                        if ( commandParts.length > 1 ) {
                            commandValue = commandParts[ 0 ];
                        }
                        // pretty up the command args with html
                        commandHelp = '<div class="command-syntax">' + prettyCommandArguments( commandSyntax ) + '</div>';
                        var commandInstruction = parts[ 1 ].trim();
                        if (dome.preferences.broadSearch) {
                            commandSearch += commandInstruction;
                        }
                        commandHelp += '<div class="command-instruction">' + prettyCommandArguments( commandInstruction ) + '</div>';
                        if ( parts.length > 2 && parts[ 2 ] != '' ) {
                            var commandRequires = parts[ 2 ].trim();
                            if (dome.preferences.broadSearch) {
                                commandSearch += commandRequires;
                            }
                            commandHelp += '<div class="command-requires">' + commandRequires + '</div>';
                        }

                    }
                    out[ out.length ] = { 'label': commandSearch, 'display': '<a>' + commandHelp + '</a>', 'value': commandValue };
                    return out;
                }, [] );

                inputBuffer.commandSuggestions( {
                    delay:     0,
                    minLength: 2,
                    position:  { my: 'left bottom', at: 'left bottom', of: 'DIV#lineBuffer', offset: '10 -20' },
                    source:    function( req, next ) {
                        var term = new RegExp((req.term.length == 2 ? '^' : '') + req.term);
                        var matches = [];
                        for (var i = 0; i < dome.autoCommands.length; i++) {
                            var item = dome.autoCommands[i];
                            if (term.test(item.label)) matches.push(item);
                        }
                        next(matches);
                    },
                    classes: {
                        'ui-autocomplete': dome.transparentOverlay ? 'ui-transparent-overlay' : 'ui-solid-overlay'
                    }
                } );
            }
        } );
    };
};