dome.setupButtons = function() {

    dome.setImagesButton = function(showImages) {
        if (dome.imagesButton) {
            dome.imagesButton.html( showImages ? '<i class="icon-eye-close icon-white" aria-hidden="true"></i><span class="hidden-xs">NO IMAGES</span>' : '<i class="icon-eye-open icon-white" aria-hidden="true"></i><span class="hidden-xs">IMAGES</span>');
            if (!showImages) {
                $('I.icon-chevron-down', dome.buffer ).trigger('click');
            }
        }
    };

    if ( dome.imagesButton ) {
        dome.imagesButton.on('click', function() {
            dome.preferences.imagePreview = !dome.preferences.imagePreview;
            dome.setImagesButton(dome.preferences.imagePreview);
        });
    }

    dome.setEchoButton = function( showEcho ) {
        if (dome.echoButton) {
            dome.echoButton.html( showEcho ? '<i class="icon-volume-off icon-white" aria-hidden="true"></i><span class="hidden-xs">HIDE ECHO</span>' : '<i class="icon-volume-up icon-white" aria-hidden="true"></i><span class="hidden-xs">ECHO</span>');
        }
    };

    if ( dome.echoButton ) {
        dome.echoButton.on('click', function() {
            dome.preferences.localEcho = !dome.preferences.localEcho;
            dome.setEchoButton(dome.preferences.localEcho);
        });
    }



    if ( dome.reconnectButton ) {
        dome.reconnectButton.on('click', function() {
            window.location.reload();
        });
    }

    if ( dome.saveButton ) {
        dome.saveButton.on('click', function() {
            var now = new Date();
            var timestamp = '' + (now.getMonth()+1) + now.getDate() + now.getFullYear() + now.getHours() + now.getMinutes();
            var form = $('#save-form');
            form.attr('action', '/save/buffer.' + timestamp + '.html');
            $('input', form).val(dome.buffer.html());
            form.submit();
        });
    }

    if ( dome.clearButton ) {
        dome.clearButton.on('click', function() {
            dome.buffer.html('');
        });
    }

    if (dome.scrollButton && dome.onToggleAutoScroll) {
        dome.scrollButton.on('click', dome.onToggleAutoScroll);
    }

    if ( dome.closeAllButton ) {
        dome.closeAllButton.on('click', function() {
            if (dome.spawned) {
                for ( var i = 0; i < dome.spawned.length; i++ ) {
                    if ( dome.spawned[ i ] ) {
                        dome.spawned[ i ].close();
                    }
                }
            }
            if (dome.channels) {
                for (var i = 0; i < dome.channels.length; i++) {
                    if (dome.channels[i]['window']) {
                        dome.channels[i].window.close();
                    }
                }
            }
            window.close();
        });
    }

    dome.attachImage = function( jqElem, imageId, url ) {
        var isVideo = url.toLowerCase().match( /mp4|gifv$/ );
        var isYouTube = dome.parseYouTubeID( url );
        var segment = '<br><a href="' + url + '" target="_blank">';
        if ( isVideo ) {
            segment += '<video id="' + imageId + '" loop muted autoplay class="shown-image" style="max-width: 75%">';
            segment += '<source type="video/mp4" src="' + url.replace( /gifv$/, 'mp4' ) + '">';
            segment += '</video>';
        } else if ( isYouTube ) {
            var width = Math.min( dome.buffer.width() - 20, 560 );
            var height = Math.floor( width * 0.5652 );
            segment += '<iframe id="';
            segment += imageId;
            segment += '" class="shown-image" width="';
            segment += width;
            segment += '" height="';
            segment += height;
            segment += '" src="https://www.youtube.com/embed/';
            segment += isYouTube;
            segment += '" frameborder="0" allowfullscreen></iframe>';
        } else {
            segment += '<img class="shown-image" id="' + imageId + '" src="' + url + '" style="max-width: 75%">';
        }
        segment += '</a><br>';

        jqElem.html( segment );
    };

    dome.toggleImage = function(elem, imageId, imageURL) {
        var control = $(elem);
        var span = $('SPAN#s' + imageId, dome.buffer);
        if (!control.length || !span.length) {
            console.log(control, span, imageId);
            return;
        } else if (control.hasClass('icon-chevron-down')) {
            // they want to hide the image
            control.removeClass('icon-chevron-down');
            control.addClass('icon-chevron-up');
            span.html('');
        } else {
            // they want to show the image
            control.removeClass('icon-chevron-up');
            control.addClass('icon-chevron-down');
            dome.attachImage( span, imageId, imageURL );
        }
    };
};
