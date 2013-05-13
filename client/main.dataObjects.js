
var ItemsPerPage= 20;

var sessionGet= function( name ) {
    return Session.get('dataObjects.' + name);
}
var sessionSet= function( name, value ) {
    return Session.set('dataObjects.' + name, value);
}

Template.dataObjects.currentTypeVersion= function() {
    var typeVersion= sessionGet('currentTypeVersion');
    if ( !typeVersion ) return;

    return typeVersion.type + " " + typeVersion.version;
};

var getSchemas= getCachedData('getTypeVersions');
var getObjectIds= getCachedData('getIdsByTypeVersion');
var getAgroObject= getCachedData('getAgroObject');

Template.dataObjects.schemas= function() {
    var schemas= getSchemas();
    if ( !schemas ) return;

    return Object.keys(schemas).map(function(type) {
        return {
            type: type,
            versions: schemas[type].map(function( v ) {
                return {
                    type: type,
                    version: v,
                };
            }),
        }
    });
};

Template.dataObjects.events({
    'click ul>li>ul>li>a': function( event ) {
        sessionSet('currentTypeVersion', {
            type: this.type,
            version: this.version,
        });
        sessionSet('pageNo', 0);
        return false;
    },
});

var getSelectedIds= function() {
    return getObjectIds(sessionGet('currentTypeVersion')) || [];
}

Template.dataObjects.pagination= function() {
    return new Handlebars.SafeString(Template.pagination({count: getPageCount(), sessionName: 'dataObjects.pageNo'}));
};

var getPageCount= function() {
    var ids= getSelectedIds();
    var count= ids.length;
    if ( count % ItemsPerPage === 0 ) return count / ItemsPerPage;
    return Math.floor(count / ItemsPerPage) + 1;
};

Template.dataObjects.events({
    'click .objectIds a': function( event ) {
        sessionSet('objectId', this.toString());
    },
});

Template.dataObjects.activeObjectClass= function( id ) {
    return sessionGet('objectId') == id ? 'active' : '';
};

Template.dataObjects.currentObjectId= function() {
    return sessionGet('objectId');
};

Template.dataObjects.objectIds= function() {
    var ids= getSelectedIds();
    var page= sessionGet('pageNo');
    return ids.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
};


