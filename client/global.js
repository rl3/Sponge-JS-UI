
var session= SpongeTools.localSession('global');

Handlebars.registerHelper('advancedView', function() {
    return SpongeTools.advancedView();
});

Handlebars.registerHelper('isAdmin', SpongeTools.isAdmin);

SpongeTools.advancedView= function( value ) {
    if ( arguments.length ) session('advancedView', value);
    return session('advancedView');
};

SpongeTools.editor= function( onChange ) {
    return function( context, property ) {
        return new Handlebars.SafeString(Template.edit(
            new GuiTools.Edit({
                get: function() { return context[property]; },
                set: function( newValue ) {
                    context[property]= newValue;
                    if ( onChange ) onChange(context, property);
                },
            })
        ));
    }
};

SpongeTools.download= function( data, options ) {
    if ( !options ) options= {};

    var blob= new Blob([data], {type: options.contentType});
    var fileName= options.fileName;

    var href= window.URL.createObjectURL(blob);

    var a = document.createElement('a');
    if ( fileName ) a.download = fileName;
    a.href = href;
    a.style.display= 'none';

    document.body.appendChild(a);

    a.onclick= function() {
        document.body.removeChild(a)

        // Need a small delay for the revokeObjectURL to work properly.
        setTimeout(function() {
            window.URL.revokeObjectURL(href);
        }, 1500);
    };

    a.click();
};
