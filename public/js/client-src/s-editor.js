dome.setupEditorSupport = function() {
    window.getSocket = function() { return dome.socket; }; // for our editor windows


    // analyze the editor properties to determine which editor
    dome.makeEditor = function ( editor ) {

        var editWindow = null;

        if ( _.has( dome.spawned, editor.editorName ) && dome.spawned[ editor.editorName ] != null ) {
            editWindow = dome.spawned[ editor.editorName ];
            editWindow.focus();
            if ( !editWindow.confirm( 'Replace existing editor of the same name? You may have active edits.' ) ) {
                return null;
            }
        }

        // if there is no upload command, its a read only editor
        var type = 'basic-readonly';
        if ( editor.uploadCommand ) {
            if ( editor.uploadCommand.indexOf( '@program' ) != -1 ) {
                // verb editor
                type = 'verb';
            } else {
                // theres some other command
                type = 'basic';
            }
        }

        if ( editor[ 'type' ] ) {
            type = editor[ 'type' ];
        }

        // strip leading linebreaks
        editor.buffer = editor.buffer.replace( /^\n/, '' ).replace( /[\r\n]+$/, '' );

        var editorURL = '/editor/' + type + '/?et=' + dome.preferences.edittheme + '&ts=' + (new Date()).getTime();
        if ( editWindow != null && _.has( editWindow, 'updateEditor' ) ) {
            editWindow.updateEditor( editor.buffer );
        } else {
            var windowConfig = 'width=640,height=480,resizeable,scrollbars';
            editWindow = window.open( editorURL, '' + editor.editorName, windowConfig );
        }

        editWindow.editorData = editor;
        editWindow.uploadSocket = socket;
        editWindow.parentWindow = window;
        editWindow.focus();

        return editWindow;
    };

    dome.updateEditorListView = function () {
        var v = dome.editorListView;
        if ( v == null ) {
            console.log( 'no editor list view' );
            return;
        }
        v.hide();
        v.html( '' );
        if ( _.isEmpty( dome.spawned ) ) {
            return;
        }
        var listHTML = '<ul>';
        for ( var title in dome.spawned ) {
            if ( !dome.spawned.hasOwnProperty( title ) ) {
                continue;
            }
            var editWin = dome.spawned[ title ];
            if ( editWin != null ) {
                listHTML += '<li data-editor="' + title + '">';
                listHTML += '<span data-editor="' + title + '" class="truncate" title="' + title + '">' + title + '</span>';
                listHTML += '<a data-editor="' + title + '" title="close editor" href="javascript:void(0);">';
                listHTML += '<i data-editor="' + title + '" class="glyph-button-close"></i></a></li>';
            }
        }
        listHTML += '</ul>';
        v.html( listHTML );
        v.show();
    };

  

    var editorListClicked = function(editorName, action) {
        console.log(editorName, action, dome.spawned[editorName]);
        if (dome.spawned[editorName] != null) {
            dome.spawned[editorName].focus();
            if (action == 'close') {
                dome.spawned[editorName].close();
                delete dome.spawned[editorName];
            }
        }
        dome.updateEditorListView();

    };


    if (dome.editorListView != null) {
        dome.editorListView.on('click', function(e) {
            if (!e.currentTarget) {
                return;
            }
            var $elem = $(e.target);
            var editorName = $elem.data('editor');
            editorListClicked( editorName, ( e.target.tagName != 'I' && e.target.tagName != 'A') ?  'zoom' : 'close' );
        });
    }

    dome.editorClosed = function(editorName) {
        if ( _.has(dome.spawned, editorName)) {
            delete dome.spawned[editorName];
            dome.updateEditorListView();
        }
    };
};