
var T= DataObjectTools.Template;

var error= DataObjectTools.injectVar({}, 'error');

T.select('loginPanel');

T.helper('error', function() {
    return error();
});

T.events({
    'submit form': function() {
        var username= $('[name=username]').val();
        var password= $('[name=password]').val();

        error(undefined);

        Meteor.loginWithPassword(username, password, function( err ) {
            if ( err ) error(err);
        });

        return false;
    }
});

