
$(function( $ ) {
    switch ( SpongeTools.Mode ) {
        case 'exportWizard': window.document.title= 'Export-Wizard'; break;
        default: window.document.title= 'Job-Manager'; break;
    }
});

Meteor.loginWithSpongeApi= function( username, password, callback ) {
    var loginRequest= { method: 'agrohyd-api', username: username, password: password };
    Accounts.callLoginMethod({
        methodArguments: [ loginRequest ],
        userCallback: callback,
    })
};

UI.registerHelper('advancedView', function() {
    return SpongeTools.advancedView();
});

UI.registerHelper('isAdmin', SpongeTools.isAdmin);

UI.registerHelper('isExportMode', function() {
    return SpongeTools.Mode === 'exportWizard';
});

UI.registerHelper('applicationName', function() {
    return SpongeTools.Mode === 'exportWizard' ? 'Export Wizard' : 'Job-Manager';
});

SpongeTools.advancedView= SpongeTools.ReactiveValue();

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
        Meteor.setTimeout(function() {
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
        href+= ( href.match(/\?/) ? '&' : '?' ) + Object.keys(options.query).map(function( name ) {
             return encodeURIComponent(name) + '=' + encodeURIComponent(options.query[name]);
        }).join('&');
    }

    a.href = href;
    // a.target= '_new';
    a.style.display= 'none';

    if ( options.target ) a.target= options.target;

    document.body.appendChild(a);

    a.onclick= function() {
        Meteor.setTimeout(function() {
            document.body.removeChild(a);
        }, 2000);

        if ( cb ) cb();
    };

    a.click();
};


