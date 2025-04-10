
var isReadOnly = function(cmd) {
    return (cmd == 'none' || !cmd);
};

$(document).ready(function(){
  
    var data = window.editorData;
    if ( data == null ) {
        data = { 'editorName' : 'Scratch', 'uploadCommand' : 'none', 'buffer' : '' };
    }
  
    var uploadCommand = data.uploadCommand;
    var editorName = data.editorName;
    var buffer = data.buffer;
    var initialValue = buffer;
  
    var cta = $('button.upload');
    var abort = $('button.abort');
    var basicEditor = $('div.editor textarea');

    var updateEditor = window.updateEditor = function(content) {
        console.log('updating editor ...');
        console.log(verbEditor);
        if (verbEditor != null ) {
            verbEditor.setValue(content);
            initialValue = verbEditor.getValue();
        } else if (basicEditor != null && basicEditor.length > 0 ) {
            basicEditor.text(content);
            initialValue = basicEditor.val();
        } else {
            console.log('no editor found');
        }
    };
    updateEditor(buffer);

    // initial setup
    document.title = (isReadOnly(uploadCommand) ? 'Viewing ' : 'Editing ') + editorName;
    cta.html(uploadCommand);
  
    // upload button
    if ( cta && cta.length >= 1) {
        cta.click(function() {
            if (isReadOnly(uploadCommand)) {
                return;
            }
            //alert(editor.val());
            //var socket = window.uploadSocket;
            var socket = window.parentWindow.getSocket();
            socket.emit('input', uploadCommand, function( state ) {
                var uploadData = '';
                if ( verbEditor != null ) {
                    uploadData = verbEditor.getValue();
                    // update sync in status
                    var currentdate = new Date(); 
                    var datetime = 'Last Save: ' +
                + currentdate.getHours() + ':'  
                + currentdate.getMinutes() + ':' 
                + currentdate.getSeconds();
                    jQuery('#verb-status-holder').html(datetime); 

                } else {
                    uploadData = basicEditor.val();
                }
                socket.emit('input', uploadData + '\n.', function( state ) {
                    initialValue = uploadData;
                });
            });
        });
    }

    var safelyClosed = false;
    var notifyParentOnClose = function(eName) {
        if (window.parentWindow && window.parentWindow.dome && window.parentWindow.dome) {
            window.parentWindow.dome.editorClosed(eName);
        }
    };

    // abort or close button
    if ( abort && abort.length >= 1) {
        abort.on('click', function() {
            var val = (verbEditor != null ? verbEditor.getValue() : basicEditor.val());
            if (val == initialValue || window.confirm('Abort editing and lose your changes?')) {
                notifyParentOnClose(editorName);
                safelyClosed = true;
                window.close();
            }
        });
    }

    $(window).bind('beforeunload', function() {
        var val = (verbEditor != null ? verbEditor.getValue() : basicEditor.val());
        if (!safelClosed && val != initialValue) {
            return 'Abort editing and lose your changes?';
        }
        notifyParentOnClose(editorName);
        return;
    });
});
