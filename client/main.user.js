
var T= DataObjectTools.Template;

T.select('loginPanel');

var loginError= DataObjectTools.injectVar({}, 'error');

T.helper('error', function() {
    return loginError();
});

T.events({
    'submit form': function( event ) {
        var $form= $(event.currentTarget);
        var username= $form.find('[name=username]').val();
        var password= $form.find('[name=password]').val();

        loginError(undefined);

        Meteor.loginWithPassword(username, password, function( err ) {
            if ( err ) loginError(err);
        });

        return false;
    }
});


T.select('userEdit');

var userError= DataObjectTools.injectVar({}, 'error');
var userSuccess= DataObjectTools.injectVar({}, 'success');

T.change('created', function() {
    userError(undefined);
    userSuccess(undefined);
});

var needOldPassword= function( templateData ) {

    if ( !templateData ) templateData= this;

    var user= Meteor.user();

    // this should never happen
    if ( !user ) return false;

    // to change own password *always* require old password
    if ( user.username === this.username ) return true;

    // only admins may change password without old password
    return DataObjectTools.isAdmin();
};

T.helper('error', function() {
    var error= userError();
    if ( !error ) return;

    return error.join('<br />');
});

T.helper('success', function() {
    return userSuccess();
});

T.helper('needOldPassword', needOldPassword);

T.events({
    'submit form': function( event, template ) {
        var $form= $(event.currentTarget);
        var userId=       template.data._id;
        var userName=     template.data.username;
        var fullName=     $form.find('[name=full-name]').val();
        var oldPassword=  $form.find('[name=old-password]').val();
        var password=     $form.find('[name=new-password]').val();
        var password2=    $form.find('[name=new-password2]').val();

        var apiUsername=  $form.find('[name=api-user-name]').val();
        var apiPassword=  $form.find('[name=api-password]').val();
        var apiPassword2= $form.find('[name=api-password2]').val();

        userError(undefined);
        userSuccess(undefined);

        // reset all password fields
        $form.find('[type=password]').val('');

        var errors= [];
        var set= {};

        if ( fullName && fullName !== template.data.profile.fullName ) set['profile.fullName']= fullName;

        if ( password && password !== password2 ) errors.push("Passwords don't match");

        if ( apiUsername && apiPassword ) {
            if ( apiPassword === apiPassword2 ) {
                set['profile.agrohyd']= {
                    apiUser: apiUsername,
                    apiPassword: apiPassword,
                };
            }
            else {
                errors.push("API's passwords don't match");
            }
        }

        if ( errors.length ) {
            userError(errors);
            return false;
        }

        var successMessage= "User " + userName + "'s data successfully updated";

        if ( !Object.keys(set).length && !password ) {
            userSuccess('There is no data to change');
            return false;
        }

        if ( Object.keys(set).length ) {
            Meteor.users.update({ _id: userId }, { $set: set }, function( err, count ) {
                if ( err ) return userError([ err ]);
            });
        }

        if ( !password ) {
            userError() ? undefined : userSuccess(successMessage);
            return false;
        }

        if ( needOldPassword(template.data) ) {
            Accounts.changePassword(oldPassword, password, function( err ) {
                if ( err ) return userError([ err ]);

                return userSuccess(successMessage);
            });
            return false;
        }

        Accounts.setPassword(template.data._id, password, function( err ) {
            if ( err ) return userError([ err ]);

            return userSuccess(successMessage);
        });
        return false;
    }
});

T.select('userPanel');



T.events({
    'click a': function( event, template ) {
        $(template.find('.sign-out-panel')).toggle();
        return false;
    },
    'click button': function( event, template ) {
        Meteor.logout();
    },
});

