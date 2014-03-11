
var T= SpongeTools.Template;

T.select('loginPanel');

var loginError= SpongeTools.injectVar({}, 'error');

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

var userError= SpongeTools.injectVar({}, 'error');
var userSuccess= SpongeTools.injectVar({}, 'success');

T.addFn('created', function() {
    userError(undefined);
    userSuccess(undefined);
});

var needOldPassword= function( templateData ) {

    // new users don't hav an old password
    if ( !templateData._id ) return false;

    var user= Meteor.user();

    // this should never happen
    if ( !user ) return false;

    // to change own password *always* require old password
    // only admins may change password without old password
    return user.username === templateData.username || !SpongeTools.isAdmin();
};

T.helper('error', function() {
    var error= userError();
    if ( !error ) return;

    return error.join('<br />');
});

T.helper('success', function() {
    return userSuccess();
});

T.helper('needOldPassword', function() {
    return needOldPassword(this);
});

T.helper('newUser', function() {
    return this.username && this.username[0] === ' ';
});

T.helper('isAdmin', function() {
    return SpongeTools.isAdmin();
});

T.helper('changePasswordAllowed', function() {
    if ( SpongeTools.isAdmin() ) return true;

    return !SpongeTools.hasRole('chpwDenied', this);
});

T.helper('chpwAllowed', function() {
    return !SpongeTools.hasRole('chpwDenied', this);
});

T.events({
    'submit form': function( event, template ) {
        var $form= $(event.currentTarget);
        var userId=       template.data._id;
        var userName=     userId ? template.data.username : $form.find('[name=user-name]').val().trim();
        var fullName=     $form.find('[name=full-name]').val().trim();
        var chpwAllowed=  $form.find('[name=change-pw-allowed]').attr('checked');
        var oldPassword=  $form.find('[name=old-password]').val();
        var password=     $form.find('[name=new-password]').val();
        var password2=    $form.find('[name=new-password2]').val();

        var apiUsername=  $form.find('[name=api-user-name]').val().trim();
        var apiPassword=  $form.find('[name=api-password]').val();
        var apiPassword2= $form.find('[name=api-password2]').val();

        userError(undefined);
        userSuccess(undefined);

        // reset all password fields
        $form.find('[type=password]').val('');

        var errors= [];

        var set= {};
        var update= {};

        if ( fullName && fullName !== template.data.profile.name ) set['profile.name']= fullName;

        if ( password && password !== password2 ) errors.push("Passwords don't match");

        if ( apiUsername && apiUsername !== (template.data.profile.agrohyd || {}).apiUser ) set['profile.agrohyd.apiUser']= apiUsername;
        if ( apiUsername && apiPassword ) {
            if ( apiPassword === apiPassword2 ) {
                set['profile.agrohyd.apiPassword']= apiPassword;
            }
            else {
                errors.push("API's passwords don't match");
            }
        }
        if ( SpongeTools.isAdmin() ) {
            update[chpwAllowed ? '$pull' : '$addToSet' ]= { roles: 'chpwDenied' };
        }

        if ( errors.length ) {
            userError(errors);
            return false;
        }

        // new user
        if ( !userId ) {
            Accounts.createUser({
                username: userName,
                password: password,
                profile: {
                    name: fullName,
                    agrohyd: {
                        apiUser: apiUsername,
                        apiPassword: apiPassword,
                    },
                },
                roles: chpwAllowed ? [] : ['chpwDenied'],
            }, function( err ) {
                if ( err ) return userError(err);

                userSuccess('User ' + userName + ' successfully created');
            });
            return false;
        }

        var successMessage= "User " + userName + "'s data successfully updated";

        if ( Object.keys(set).length ) update.$set= set;

        if ( !Object.keys(update).length && !password ) {
            userSuccess('There is no data to change');
            return false;
        }

        if ( Object.keys(update).length ) {
            Meteor.users.update({ _id: userId }, update, function( err, count ) {
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
    'click a.sign-out': function( event, template ) {
        Meteor.logout();
    },
    'click a.edit-profile': function( event, template ) {
        var session= SpongeTools.localSession('main-navigation');
        session('username', Meteor.user().username);
        session('view', 'user');
        $(template.find('.sign-out-panel')).hide();
    },
});

