
var isReadOnly = function(cmd) {
    return (cmd == 'none' || !cmd);
};

$(document).ready(function(){
  
    var data = window.editorData;
    if ( data == null ) {
        data = { 'editorName' : 'Scratch', 'uploadCommand' : 'none', 'buffer' : '', 'note': { 'subject': '', 'notebody' : '', 'createdat' : new Date() } };
    }
  
    var uploadCommand = data.uploadCommand;
    var editorName = data.editorName;
    var buffer = data.buffer;
    var initialValue = buffer;
  
    var cta = $('button.upload');
    var abort = $('button.abort');
    var basicEditor = $('div.editor textarea');
  
    if ( verbEditor != null )  {
        verbEditor.setValue(buffer);
        initialValue = verbEditor.getValue();
    } else if ( basicEditor != null && basicEditor.length > 0 ) {
        basicEditor.text(buffer);
        initialValue = basicEditor.val();
    }

    var subjectField = $('.editor .note-header .note-subject .header-value');
    subjectField.text(data.note.subject);

    var tsField = $('.editor .note-header .note-timestamp .header-value');
    tsField.text(data.note.createdat);

    if (data.note['references']) {
        var refField = $('.editor .note-header .note-objects .header-value');
        var refHTML = '';
        for ( var i = 0; i < data.note.references.length; i++ ) {
            var ref = data.note.references[i];
            refHTML  += ('<a href="javascript:void(0);" class="obj-text" data-obj="#' + ref.objectnumber + '">' + ref.objectname + ' (#' + ref.objectnumber + ')</a>');
        }
        refField.html(refHTML);
    }

    if (data.note['history']) {
        var authorField = $('.editor .note-header .note-authors .header-value');
        var authorHTML = '';
        for (var i = 0; i < data.note.history.length; i++) {
            var author = data.note.history[i];
            authorHTML += ('<a href="javascript:void(0);" class="obj-text" data-obj="#' + author.objectnumber + '">' + author.objectname + '</a>');
        }
        authorField.html(authorHTML);
    }


    //console.log(data.note);

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
                } else {
                    uploadData = basicEditor.val();
                }
                socket.emit('input', uploadData + '\n.', function( state ) {
                    initialValue = uploadData;
                });
            });
        });
    }
  
    // abort or close button
    if ( abort && abort.length >= 1) {
        abort.on('click', function() {
            var val = (verbEditor != null ? verbEditor.getValue() : basicEditor.val());
            if (val == initialValue || window.confirm('Abort editing and lose your changes?')) {
                window.close();
            }
        });
    }
});