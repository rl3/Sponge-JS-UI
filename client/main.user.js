
var editUsername= SpongeTools.editUsername;

var T= SpongeTools.Template;

T.select('loginPanel');

var loginError= SpongeTools.ReactiveValue();

T.helper('error', function() {
    return loginError();
});

T.helper('loggingIn', function() {
    return Meteor.loggingIn();
});

T.events({
    'submit form': function( event ) {
        var $form= $(event.currentTarget);
        var username= $form.find('[name=username]').val();
        var password= $form.find('[name=password]').val();

        loginError(undefined);

        Meteor.loginWithSpongeApi(username, password, function( err ) {
            if ( err ) loginError(err);
        });

        return false;
    }
});


T.select('userEdit');

var userError= SpongeTools.ReactiveValue();
var userSuccess= SpongeTools.ReactiveValue();

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

var getUserData= SpongeTools.getCachedData('getUserData', SpongeTools.TIMEOUT_SHORT);
var saveUser= SpongeTools.getCachedData('saveUser', 1);
var removeUser= SpongeTools.getCachedData('removeUser', 1);
var getAllRoles= SpongeTools.getCachedData('getAllRoles');
var getAllGroups= SpongeTools.getCachedData('getAllGroupNames');

T.helper('userData', function() {
    var username= editUsername();
    if ( username.match(/^ /) ) return {};

    var userData= getUserData(username);
    return userData;
});

T.helper('allRoles', function() {
    var roles= getAllRoles();
    if ( !roles ) return;

    return roles.map(function( name ) { return { name: name, active: (this.roles || []).indexOf(name) >= 0 }; });
});

T.helper('allGroups', function() {
    var groups= getAllGroups();
    if ( !groups ) return;

    return groups.map(function( name ) { return { name: name, active: (this.groups || []).indexOf(name) >= 0 }; });
});

T.helper('needOldPassword', function() {
    return needOldPassword(this);
});

T.helper('newUser', function() {
    var username= editUsername();
    return username && username[0] === ' ';
});

T.helper('isAdmin', function() {
    return SpongeTools.isAdmin();
});

T.helper('changePasswordAllowed', function() {
    if ( SpongeTools.isAdmin() ) return true;

    return SpongeTools.hasRole('chpw', this);
});

T.helper('chpwAllowedChecked', function() {
    return SpongeTools.hasRole('chpw', this);
});

T.events({
    'submit form': function( event ) {
console.log('submit', this)
        var $form= $(event.currentTarget);
        var userId=       this._id;
        var oldUserName=  userId ? this.name : null;
        var userName=     userId ? this.name : $form.find('[name=user-name]').val().trim().replace(/\W/, '_').toLowerCase();

        var t= {};
        t.Name=           $form.find('[name=full-name]').val().trim();
        t.Mail=           $form.find('[name=email]').val().trim();
        t.Organisation=   $form.find('[name=organisation]').val().trim();
        t.Address=        $form.find('[name=address]').val().trim();
        t.Description=    $form.find('[name=description]').val().trim();
        t.www=            $form.find('[name=url]').val().trim();

        var chpwAllowed=  $form.find('[name=change-pw-allowed]').is(':checked');
        var oldPassword=  $form.find('[name=old-password]').val();
        var password=     $form.find('[name=new-password]').val();
        var password2=    $form.find('[name=new-password2]').val();
        var roles=        $form.find('[name=roles]:checked').map(function() { return $(this).val(); }).get();
        var groups=       $form.find('[name=groups]:checked').map(function() { return $(this).val(); }).get();

        userError(undefined);
        userSuccess(undefined);

        // reset all password fields
        $form.find('[type=password]').val('');

        var errors= [];

        var set= {
            name: userName,
            template: {},
        };
        if ( userId ) set._id= userId;

        for ( var prop in t ) {
            if ( t[prop] ) set.template[prop]= t[prop];
        }

        if ( password ) {
            if ( password === password2 ) {
                set['oldPassword']= oldPassword;
                set['newPassword']= password;
            }
            else {
                errors.push("Passwords don't match");
            }
        }
        if ( SpongeTools.isAdmin() ) {
            set.roles= roles.filter(function( role ) { return role !== 'chpw'; });
            set.groups= groups;
            if ( chpwAllowed ) {
                set.roles.push('chpw');
            }
        }

        if ( errors.length ) {
            userError(errors);
            return false;
        }

        console.log('updateUser', set, roles, chpwAllowed);

        saveUser(set, oldUserName);
        editUsername(userName);

        return false;
    },
    'click button.delete': function( template ) {
        SpongeTools.Confirmation.show({ title: 'Delete User', body: 'Do you really want to delete this user?', }, function() {
            var user= getUserData(editUsername());
            if ( !user ) {
                return userError(['Could not get user data. Try again!']);
            }
            removeUser( user._id );
            editUsername(' new user');
        });
    },
});

T.select('userPanel');

T.events({
    'click a.sign-out': function( event, template ) {
        Meteor.call('logout', function( err ) {
            if ( err ) loginError(err);
        });
    },
    'click a.edit-profile': function( event, template ) {
        editUsername(Meteor.user().username);
        SpongeTools.viewType('user');
        $(template.find('.sign-out-panel')).hide();
    },
    'click a.clear-user-cache': function( event, template ) {
        Meteor.call('clearCache');
    },
    'click a.clear-global-cache': function( event, template ) {
        Meteor.call('clearCache', true);
    },
});

