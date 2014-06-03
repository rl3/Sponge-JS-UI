
var session= SpongeTools.localSession('global');

UI.registerHelper('advancedView', function() {
    return SpongeTools.advancedView();
});

UI.registerHelper('isAdmin', SpongeTools.isAdmin);

SpongeTools.advancedView= function( value ) {
    if ( arguments.length ) session('advancedView', value);
    return session('advancedView');
};

SpongeTools.editorContext= function( onChange ) {
    return function( context, property ) {
        return new GuiTools.Edit({
            get: function() { return context ? context[property] : undefined; },
            set: function( newValue ) {
                if ( !context ) return;
                context[property]= newValue;
                if ( onChange ) onChange(context, property);
            },
        })
    }
};

SpongeTools.download= function( data, options ) {
    if ( !options ) options= {};

    var blob= new Blob([data], {type: options.contentType});

    var href= window.URL.createObjectURL(blob);

    SpongeTools.downloadLink(href, options, function() {
        // Need a small delay for the revokeObjectURL to work properly.
        setTimeout(function() {
            window.URL.revokeObjectURL(href);
        }, 1500);
    });
};

SpongeTools.downloadLink= function( href, options, cb ) {
    if ( !options ) options= {};

    var fileName= options.fileName;

    var a = document.createElement('a');

    if ( fileName ) a.download = fileName;

    if ( options.query ) {
        href+= '?' + Object.keys(options.query).map(function( name ) {
             return encodeURIComponent(name) + '=' + encodeURIComponent(options.query[name]);
        }).join('&');
    }

    a.href = href;
    a.target= '_new';
    a.style.display= 'none';

    if ( options.target ) a.target= options.target;

    document.body.appendChild(a);

    a.onclick= function() {
        document.body.removeChild(a)

        if ( cb ) cb();
    };

    a.click();
};
