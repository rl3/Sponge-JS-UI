
var ItemsPerPage= 50;
var jobUpdateTimeout= 10000; // 10s

var injectVar= SpongeTools.injectVar;

var dataObj= SpongeTools.shareObject;

var oldData= {};
var aclInvalidator= SpongeTools.getInvalidator('acls');
var acls;
var changes;
var owner;

var getAllUsers= SpongeTools.getCachedData('getAllUserNames');
var getAllGroups= SpongeTools.getCachedData('getAllGroupNames');

var _getAcls= SpongeTools.getCachedData('getAcl', 2000);
var getAcls= function() {
    var allUsers= getAllUsers();
    var allGroups= getAllGroups();

    if ( !allUsers || !allGroups ) return;
console.log('have allUsers');

    var data= dataObj();

    if ( !data ) {
console.log('no data');
        acls= owner= null;
        aclInvalidator(true);
        return;
    }
console.log('have data');

//    if ( acls && _.isEqual(oldData, data) ) return acls;
console.log('data changed');

    oldData= SpongeTools.clone(data);
    acls= owner= null;
    aclInvalidator(true);

    if ( !data.type ) return;

    var rawAcls= _getAcls(data.type, data.id);

    if ( !rawAcls ) return;
console.log('have rawAcls');

    acls= {
        users: {},
        groups: {},
    };
    changes= {
        add: [],
        remove: [],
    };

    allUsers.forEach(function( name ) {
        acls.users[name]= {};
    });

    allGroups.forEach(function( name ) {
        acls.groups[name]= {};
    });

    owner= null;

    rawAcls.forEach(function( acl ) {
        var o;
        switch (acl[1]) {
            case 'u': o= acls.users; break;
            case 'g': o= acls.groups; break;
            default:  return;
        }

        var name= acl.substr(2);
        if ( !(name in o) ) o[name]= {};
        o= o[name]

        switch (acl[0]) {
            case 'r': o.read= true; break;
            case 'w': o.write= true; break;
            case 'o': owner= name; // fall through
        }
    });

    if ( owner && acls.users[owner] ) delete acls.users[owner];

    return acls;
};

var addAcls= SpongeTools.getCachedData('addAcl', 1);
var removeAcls= SpongeTools.getCachedData('removeAcl', 1);

var saveAcls= function() {
    var data= dataObj();

    if ( !data ) return;

    var add= changes.add.slice();
    var remove= changes.remove.slice();

    changes= {
        add: [],
        remove: [],
    };

    if ( add.length )   addAcls(data.type, data.id, add);
    if ( remove.length) removeAcls(data.type, data.id, remove);

    // reinit acl request
    acls= null;
};


var T= SpongeTools.Template;

/**
 * Template shareObjectBody
 */
T.select('shareObjectBody');

T.helper('type', function() {
    var data= dataObj();

    return data ? data.type : undefined;
});

T.helper('owner', function() {
    getAcls();

    return owner ? owner : '';
});

T.helper('acl', function() {
    var acls= getAcls();

    if ( !acls ) return;
    return true;
});

var aclBuilder= function( property ) {
    aclInvalidator();

    return function() {
        if ( !acls || !acls[property] ) return;

        var a= acls[property];

        var result= Object.keys(a);

        result.sort();

        return result.map(function( name ) {
            return {
                name: name,
                read: a[name].read,
                write: a[name].write,
                type: property,
            };
        });
    };
};

T.helper('user', aclBuilder('users'));
T.helper('group', aclBuilder('groups'));

T.helper('checked', function( value ) {
    return !!value;
});

T.events({
    'change input': function( event ) {
        var $this= $(event.currentTarget);

        var queue= $this.is(':checked') ? 'add' : 'remove';

        var right= $this.attr('data');
        var acl= right[0] + this.type[0] + this.name;

        ['add', 'remove'].forEach(function( q ) {
            var i= changes[q].indexOf(acl);
            if ( i < 0  && q === queue ) changes[q].push(acl);
            if ( i >= 0 && q !== queue ) changes[q].splice(i, 1);
        });

        acls[this.type][this.name][right]= $this.is(':checked');
        return false;
    },
    'click button.cancel': function() {
        $('#shareObject').modal('hide');
    },
    'click button.save': function() {
        saveAcls();
        $('#shareObject').modal('hide');
    },
});
