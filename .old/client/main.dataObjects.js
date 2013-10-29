
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

var getSchemas= DataObjectTools.getCachedData('getTypeVersions');
var getObjectIdNames= DataObjectTools.getCachedData('getIdNamesByTypeVersion');

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
        return false;
    },
});

var getSelectedIdNames= function() {
    var idNames= getObjectIdNames(sessionGet('currentTypeVersion')) || [];
    idNames.sort(function( a, b ) { return String(a.name).localeCompare(String(b.name)); });
    return idNames;
}

var injectPageNumber= function( context ) {
    if ( !context.pageNumber ) context.pageNumber= DataObjectTools.ReactiveValue(0);
    return context.pageNumber;
}

Template.dataObjects.pagination= function() {
    return new Handlebars.SafeString(Template.pagination({count: getPageCount(), pageNumber: injectPageNumber(this)}));
};

var getPageCount= function() {
    var ids= getSelectedIdNames();
    var count= ids.length;
    if ( count % ItemsPerPage === 0 ) return count / ItemsPerPage;
    return Math.floor(count / ItemsPerPage) + 1;
};

Template.dataObjects.events({
    'click .objects a': function( event ) {
        sessionSet('objectIdName', this);
    },
});

Template.dataObjects.activeObjectClass= function( id ) {
    return (sessionGet('objectIdName') || {})._id == id ? 'active' : '';
};

Template.dataObjects.currentObjectName= function() {
    return (sessionGet('objectIdName') || {}).name;
};
Template.dataObjects.currentObjectId= function() {
    return (sessionGet('objectIdName') || {})._id;
};

Template.dataObjects.objects= function() {
    var ids= getSelectedIdNames();
    var page= injectPageNumber(this)();
    return ids.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
};


