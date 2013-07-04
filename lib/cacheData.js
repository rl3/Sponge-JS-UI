
var dataCache= new Meteor.Collection("Cache");

var cachedMethodUrl= {
    'getTypeVersions':         function( options ) { return 'Schema/getAllTypeVersion'; },
    'getSchemaByTypeVersion':  function( options ) { return 'Schema/getByTypeVersion/' + options.type + '/' + options.version; },
    'getAllSchemas':           function( options ) { return 'Schema/getAll'; },
    'getIdNamesByTypeVersion': function( options ) { return 'AgroObjRaw/getIdNamesByTypeVersion/' + options.type + '/' + options.version; },
    'getAgroObject':           function( id )      { return 'AgroObj/getByObjectId/' + id; },
    'getParameterSetCount':    function( id )      { return 'ParameterSetRaw/getCount/' + id; },
    'getParameterSets':        function( options ) { return 'ParameterSetRaw/getAllKeyOrdered/' + options.id + '/' + options.start + '/' + options.count; },
};

['Model', 'ModelTemplate'].forEach(function( type ) {
    cachedMethodUrl['get' + type + 'Count']= function( options ) { return type + '/getCount'; };
    cachedMethodUrl['get' + type + 's']= function( options ) { return type + '/getAllPart/' + (options.start || 0) + '/' + (options.count || 100); };
    cachedMethodUrl['get' + type + 'Names']= function( options ) { return type + '/getNames'; };
    cachedMethodUrl['get' + type]= function( id ) { return type + '/getByObjectId/' + id; };
});

var updateCache= function( id, newData, cb ) {
    if ( !cb ) cb= function() {};

    var oldData= DataObjectTools.dataCache.findOne({ _id: id });
    if ( _.isEqual(oldData, newData) ) return cb();

    var query= {
        data: newData,
        timeStamp: new Date(),
    };

    if ( oldData ) {
        return DataObjectTools.dataCache.update({ _id: id }, { $set: query, }, cb);
    }
    query._id= id;
    return DataObjectTools.dataCache.insert(query, cb);
}

DataObjectTools.dataCache= dataCache;
DataObjectTools.updateCache= updateCache;
DataObjectTools.cachedMethodUrl= cachedMethodUrl;
