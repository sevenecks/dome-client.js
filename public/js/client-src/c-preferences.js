dome.weakBrowser = function() {
    var chromeVersion = navigator.appVersion.match(/Chrome\/(\d+)/); 
    var badChrome = (chromeVersion != null && parseInt(chromeVersion[1]) >= 79);
    return badChrome;
};

dome.readPreferences = function() {
    var options = window.location.search || null;

    // user preferences
    var preferences = {
        commandSuggestions : true,
        channelWindows     : false,
        playDing           : true,
        localEcho          : false,
        colorSet           : 'acid',
        autoScroll         : 'dbl',
        edittheme          : 'twilight',
        lineBufferFont     : 'standard',
        imagePreview       : false,
        transparentOverlay : false,
        broadSearch        : true,
        performanceBuffer  : dome.weakBrowser() ? 1750 : 0 // set to 0 for unlimited buffer / weak browsers get defaulted to 1750
    };
    if (options) {
        if (options.indexOf('cs=false') != -1) {
            preferences.commandSuggestions = false;
        }

        if (options.indexOf('cw=true') != -1) {
            preferences.channelWindows=true;
        }

        if (options.indexOf('pd=false') != -1) {
            preferences.playDing = false;
        }

        if (options.indexOf('le=true') != -1) {
            preferences.localEcho = true;
        }

        if (options.indexOf('iv=true') != -1) {
            preferences.imagePreview = true;
        }

        if (options.indexOf('as=long') != -1) {
            preferences.autoScroll = 'long';
        } else if (options.indexOf('as=none') != -1) {
            preferences.autoScroll = 'none';
        }

        if ((ofIndex = options.indexOf('of=')) != -1) {
            var rest = of = options.substr(ofIndex);
            if ((n = rest.indexOf('&')) != -1) {
                of = rest.substr(0,n);
            }
            if (of.length > 3) {
                var font = of.substr(3);
                if (_.contains(FONT_CHOICES, font)) {
                    preferences.lineBufferFont = font;
                }
            }
        }

        if ((etIndex = options.indexOf('et=')) != -1) {
            var rest = et = options.substr(etIndex);
            if ((n = rest.indexOf('&')) != -1) {
                et = rest.substr(0,n);
            }
            if (et.length > 3) {
                var theme = et.substr(3);
                if (_.contains(EDIT_THEMES, theme)) {
                    preferences.edittheme = theme;
                }
            }
        }

        if ((clIndex = options.indexOf('cl=')) != -1) {
            var rest = cl = options.substr(clIndex);
            if ((n = rest.indexOf('&')) != -1) {
                cl = rest.substr(0,n);
            }
            if (cl.length > 3) {
                var colorset = cl.substr(3);
                if (_.contains(COLORSET_CHOICES, colorset)) {
                    preferences.colorSet = colorset;
                }
            }
        }

        if ((pbIndex = options.indexOf('pb=')) != -1) {
            var rest = pb = options.substr(pbIndex);
            if ((n = rest.indexOf('&')) != -1) {
                pb = rest.substr(0,n);
            }
            pb = parseInt(pb);
            if (pb > 0) {
                preferences.performanceBuffer = pb;
            }
        }

        if (options.indexOf('to=true') != -1) {
            preferences.transparentOverlay = true;
        }

        if (options.indexOf('bs=false') != -1) {
            preferences.broadSearch = false;
        }
    }
  
    return preferences;
};

var PREFERENCE_ENUM = {
    'cs' : { name: 'commandSuggestions', storeKey: 'commands', def: true },
    'cw' : { name: 'channelWindows', storeKey: 'channels', def: false },
    'pd' : { name: 'playDing', storeKey: 'playding', def: true },
    'le' : { name: 'localEcho', storeKey: 'localecho', def: false },
    'iv' : { name: 'imagePreview', storeKey: 'imageview', def: false },
    'as' : { name: 'autoScroll', storeKey: 'scroll', def: 'dbl', valid: ['dbl', 'long'] },
    'of' : { name: 'lineBufferFont', storeKey: 'outfont', def: 'standard', valid: FONT_CHOICES },
    'et' : { name: 'edittheme', storeKey: 'edittheme', def: 'twilight', valid: EDIT_THEMES },
    'cl' : { name: 'colorSet', storeKey: 'colorset', def: 'acid', valid: COLORSET_CHOICES },
    'to' : { name: 'transparentOverlay', storeKey: 'transparent', def: false },
    'bs' : { name: 'broadSearch', storeKey: 'broadly', def: true },
    'pb' : { name: 'performanceBuffer', storeKey: 'buffer', def: ( dome.weakBrowser() ? 1750 : 0 ) }
};

var helpDocs = [
    'Help on @client-option:\n',
    '  @client-options\n',
    '  @client-option &lt;option name&gt; [&lt;new value&gt;]\n',
    '\n',
    '  Options Include:\n'
];

for (var shortCode in PREFERENCE_ENUM) {
    var prefName = PREFERENCE_ENUM[shortCode].name;
    PREFERENCE_ENUM[prefName] = PREFERENCE_ENUM[shortCode];
    helpDocs[helpDocs.length] = '   [' + shortCode + '] ' + prefName + '\n';
}

var CLIENT_OPTION_NAME_ERROR = 'Unknown @client-option specified, check @client-options' + '\n';
var CLIENT_OPTION_VALUE_ERROR = 'Invalid @client-option value, must be one of ';
var CLIENT_OPTIONS_HELP = helpDocs;

var showClientOptionHelp = function() {
    dome.buffer.append(CLIENT_OPTIONS_HELP);
};

var translateClientOptionName = function(optionName) {
    if (PREFERENCE_ENUM[ optionName ] != null) {
        return PREFERENCE_ENUM[ optionName ].name;
    }
    return optionName;
};

var showClientOption = function(optionName) {
    var opts = _.keys(dome.preferences);
    if (optionName) {
        if (!_.has(dome.preferences,optionName)) {
            return dome.buffer.append(CLIENT_OPTION_NAME_ERROR);
        }
        opts = [optionName];
    }

    _.each( opts, function( opt ) {
        dome.buffer.append( '  ' + opt + ' : ' + dome.preferences[opt] + '\n' );
    });
};

var setClientOption = function(optionName, optionValue) {
    if (!_.has(dome.preferences,optionName)) {
        return dome.buffer.append(CLIENT_OPTION_NAME_ERROR);
    }

    if (optionValue == 'true') {
        optionValue = true;
    } else if (optionValue == 'false') {
        optionValue = false;
    }

    var validValues = PREFERENCE_ENUM[ optionName ].valid || [true, false];

    if (!_.contains(validValues, optionValue)) {
        return dome.buffer.append(CLIENT_OPTION_VALUE_ERROR + validValues.toString() + '\n');
    }

    if (clientOptions) clientOptions.save( PREFERENCE_ENUM[ optionName ].storeKey, optionValue );

    if (dome.preferences[ optionName ] != optionValue) {
        dome.buffer.append( 'changing @client-option ' + optionName + ' to ' + optionValue + '\n' );
        if ( optionName == 'colorSet') {
            dome.buffer.removeClass('colorset-' + dome.preferences.colorSet);
            dome.inputReader.removeClass('colorset-' + dome.preferences.colorSet);
        }
        if ( optionName == 'lineBufferFont') dome.buffer.removeClass(dome.preferences.lineBufferFont+'Text');
        if ( optionName == 'transparentOverlay') {
            var ac = $('.ui-autocomplete');
            if (ac != null) {
                ac.removeClass(dome.preferences.transparentOverlay ? 'ui-transparent-overlay' : 'ui-opaque-overlay');
            }
        }
        dome.preferences[optionName] = optionValue;
        if (optionName == 'lineBufferFont') dome.buffer.addClass(dome.preferences.lineBufferFont + 'Text');
        if (optionName == 'colorSet' && dome.preferences.colorSet != 'normal') {
            dome.buffer.addClass('colorset-' + dome.preferences.colorSet);
            dome.inputReader.addClass('colorset-' + dome.preferences.colorSet);
        }
        if ( optionName == 'transparentOverlay') {
            var ac = $('.ui-autocomplete');
            if (ac != null) {
                ac.addClass(dome.preferences.transparentOverlay ? 'ui-transparent-overlay' : 'ui-opaque-overlay');
            }
        }
        if ( optionName == 'broadSearch' && dome.preferences.commandSuggestions) {
            if (dome.inputReader) dome.inputReader.commandSuggestions( 'destroy' );
            if (dome.autoComplete) {
                dome.autoComplete();
                dome.setupAutoComplete( dome.inputReader, dome.userType );
            }
        }
        if ( optionName == 'commandSuggestions') {
            if (dome.preferences.commandSuggestions) {
                if (dome.autoComplete) {
                    dome.autoComplete();
                    dome.setupAutoComplete( dome.inputReader, dome.userType );
                }
            } else {
                if (dome.inputReader) dome.inputReader.commandSuggestions( 'destroy' );
            }
        }
        if (optionName == 'localEcho') {
            dome.setEchoButton(dome.preferences.localEcho);
        }
        if (optionName == 'imagePreview') {
            dome.setImagesButton(dome.preferences.imagePreview);
        }
    }
};

dome.parseClientOptionCommand = function( command ) {
    console.log( command );
    if (command == '@client-options') {
        return showClientOption();
    } else {
        var commandParts = command.split(' ');
        if (commandParts.length < 2) {
            return showClientOptionHelp();
        } else {
            var optionName = translateClientOptionName(commandParts[1]);

            if (commandParts.length < 3) {
                // read
                showClientOption(optionName);
            } else {
                // write
                setClientOption( optionName, commandParts[ 2 ]);
            }
        }
    }
};
