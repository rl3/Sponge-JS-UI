
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
            SpongeTools.showMap();
            SpongeTools.addMapMarker(lon, lat, { infotext: '<div><div><b>Job-Titel</b></div><div>Hier kommt die Job-Beschreibung hin.</div></div>' });
        })
    ;

});

