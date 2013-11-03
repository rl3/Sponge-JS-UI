
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

    $('body').on('blur', 'input.double', function( event ) {
        return validate(this, /^\-?(\d+\.)?\d+$/);
    });
    $('body').on('blur', 'input.input', function( event ) {
        return validate(this, /^\-\d+$/);
    });
});

