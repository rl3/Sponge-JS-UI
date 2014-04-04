
jQuery(function( $ ) {

    var validate= function( self, regexp ) {
        var $this= $(self);
        var $control= $this.closest('.control-group');
        var value= $this.val();
        if ( value && !value.match(regexp) ) {
            $this.focus().select();
            $control.addClass('error');
            return false;
        }
        $control.removeClass('error');
        return true;
    };

    $('body')
        .on('blur', 'input.double', function( event ) {
            return validate(this, /^\-?(\d+\.)?\d+$/);
        })
        .on('blur', 'input.input', function( event ) {
            return validate(this, /^\-\d+$/);
        })
        .on('click', 'a.location', function( event ) {
            var $a= $(this);
            var lat= +$a.attr('lat');
            var lon= +$a.attr('lon');
            var infoTitle= $a.attr('info-title');
            var infoText= $a.attr('info-text');
            var options= {
                center: true,
            };
            if ( infoTitle || infoText ) {
                options.infotext= '<div class="map-infotext"><div class="title">' + (infoTitle || '') + '</div><div class="text">' + (infoText || '') + '</div></div>';
            }
            SpongeTools.Map.clear();
            SpongeTools.Map.show(function() {
                SpongeTools.Map.addMarker(lon, lat, options);
            });
        })
        .on('click', '.accordion-toggle', function() {
            var $accordion= $(this).closest('.accordion');
            var self= this;
            $accordion.find('.collapse').collapse('hide');
            $($(this).attr('href')).collapse('show');
        })
    ;
});

