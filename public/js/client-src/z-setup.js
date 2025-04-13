$(document).ready(function(){

    // references to various objects
    dome = _.extend(dome, {
        userType        : 'p',
        socket          : null,
        socketState     : SOCKET_STATE_ENUM.BEFORE_FIRST,
        titleBarText    : null,
        client          : $('#browser-client'),
        buffer          : $('#lineBuffer'),
        statusDisplay   : $('#statusMsg'),
        editorListView  : $('#editor-list-view'),
        inputReader     : $('#inputBuffer'),
        reconnectButton : $('#button-reconnect'),
        saveButton      : $('#button-save, #button-save-mini'),
        scrollButton    : $('#button-auto-scroll'),
        clearButton     : $('#button-clear-buffer'),
        echoButton      : $('#button-local-echo'),
        imagesButton    : $('#button-view-images'),
        closeAllButton  : $('#button-closeall'),
        perfBufferFlag  : $('#perf-buffer-flag'),
        disconnectView  : {
            overlay     : $('#disconnect-overlay'),
            buttonGroup : $('.disconnect-buttons')
        },
        spawned         : {},
        channels        : [
            //    { name: 'Debug-Info' }
        ],
        makeEditor : null,
        channel: null,
        refreshRecent : function(e) {e.preventDefault();}
    });

    dome.preferences = dome.readPreferences();
    if (dome.preferences.lineBufferFont != 'standard') dome.buffer.removeClass('standardText').addClass(dome.preferences.lineBufferFont + 'Text');
    if (dome.preferences.colorSet != 'normal') dome.buffer.addClass('colorset-' + dome.preferences.colorSet);
    if (dome.setupChannels) dome.setupChannels();
    if (dome.inputReader) {
        if (dome.setupInputReader) dome.setupInputReader();
        if (dome.preferences.commandSuggestions && dome.autoComplete != null) {
            dome.autoComplete();
            dome.setupAutoComplete( dome.inputReader, dome.userType );
        }
    }
    if (dome.setupWindowHandlers) dome.setupWindowHandlers();
    if (dome.setupEditorSupport) dome.setupEditorSupport();
    if (dome.setupAutoscroll) dome.setupAutoscroll();
    if (dome.setupButtons) dome.setupButtons();

    dome.setupOutputParser();
    setTimeout( function() {
        dome.socket = dome.setupSocket();
        dome.socket.on('data', dome.parseSocketData);
    }, 500);
});
