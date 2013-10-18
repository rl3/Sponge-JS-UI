
var dataCache= new Meteor.Collection("Cache");
var dataCacheMeta= new Meteor.Collection("CacheMeta");

var oid2Str= function( oid ) {
    return !oid ? null : typeof oid === 'object' ? oid.toHexString() : String(oid);
};

var str2Oid= function( str ) {
    if ( str instanceof Meteor.Collection.ObjectID ) return str;

    if ( str || String(str).length !== 24 ) return null;
    try {
        return new Meteor.Collection.ObjectID(String(str));
    }
    catch ( e ) {}
    return null;
};

var cachedMethodUrl= {
    'getTypeVersions':         function( options ) { return 'Schema/getAllTypeVersion'; },
    'getSchemaByTypeVersion':  function( options ) { return 'Schema/getByTypeVersion/' + options.type + '/' + options.version; },
    'getAllSchemas':           function( options ) { return 'Schema/getAll'; },
    'getIdNamesByTypeVersion': function( options ) { return 'AgroObjRaw/getIdNamesByTypeVersion/' + options.type + '/' + options.version; },
    'getAgroObject':           function( id )      { return 'AgroObj/getByObjectId/' + oid2Str(id); },
    'getParameterSetCount':    function( id )      { return 'ParameterSetRaw/getCount/' + oid2Str(id); },
    'getParameterSets':        function( options ) { return 'ParameterSetRaw/getAllKeyOrdered/' + oid2Str(options.id) + '/' + options.start + '/' + options.count; },

    'getModelArgs':            function( modelId ) { return 'Model/getArgs/' + oid2Str(modelId); },
    'getMatchingTypes':        function( type )    { return { url: 'Model/getCompatibleTypesByType', data: {type: type}, method: 'POST', }; },
    'getTagsByTypeVersion':    function( options ) { return 'AgroObj/getTagsByTypeVersion/' + options.objectType + '/' + options.version; },
    'getMatchingObjects':      function( options ) { return {
        url: 'AgroObj/getByTypeVersionName',
        data: {
            objectType: options.objectType,
            version:    options.version,
            name:       options.name,
            limit:      options.limit || 100,
        },
        method: 'POST',
    }; },
    'startJob':                function( options ) { return {
        url: 'Job/startJob',
        data: {
            modelId:    str2Oid(options.modelId),
            inArgs:     options.args,
        },
        method: 'PUT',
    }; },
    'getJobs':                 function( options ) { return 'Job/getJobs/' + (options.userId ? oid2Str(options.userId) : 0) + '/' + (options.modelId ? oid2Str(options.modelId) : 0); },
    'getJob':                  function( jobId )   { return 'Job/getByJobId/' + jobId; },
    'getJobResult':            function( options ) { return 'Job/getResult/' + options.jobId; },
    'restartJob':              function( jobId )   { return 'Job/restartJob/' + jobId; },
    'removeJob':               function( jobId )   { return 'Job/removeJobById/' + jobId; },
};

['Model', 'ModelTemplate'].forEach(function( type ) {
    cachedMethodUrl['get' + type + 'Count']= function( options ) { return type + '/getCount'; };
    cachedMethodUrl['get' + type + 's']=     function( options ) { return type + '/getAllPart/' + (options.start || 0) + '/' + (options.count || 100); };
    cachedMethodUrl['get' + type + 'Names']= function( options ) { return type + '/getNames'; };
    cachedMethodUrl['get' + type]=           function( id )      { return type + '/getByObjectId/' + oid2Str(id); };
});

/**
 *  MongoDB knows how to handle keys starting with '$' (except keys in the first level)
 *  Unfortunately, Meteor's MongoDB doesn't... :(
 */
var convertToMongo= function( object ) {
    if ( !object || typeof object !== 'object' || '$' in object || ( object.constructor !== Object && object.constructor !== Array) ) return object;
    object.$= undefined;
    for ( var key in object ) {
        if ( key === '$' ) continue;

        var v= object[key];
        if ( key[0] === '$' ) {
            object['_' + key]= v;
            delete object[key];
        }
        if ( v && typeof v === 'object' ) convertToMongo(v);
    }
    delete object.$;
    return object;
};

var convertFromMongo= function( object ) {
    if ( !object || typeof object !== 'object' || '$' in object || ( object.constructor !== Object && object.constructor !== Array) ) return object;
    object.$= undefined;
    for ( var key in object ) {
        var v= object[key];
        if ( key[0] === '_' && key[1] === '$' ) {
            object[key.substr(1)]= v;
            delete object[key];
        }
        if ( v && typeof v === 'object' ) convertFromMongo(v);
    }
    delete object.$;
    return object;
};

DataObjectTools.dataCache= dataCache;
DataObjectTools.dataCacheMeta= dataCacheMeta;
DataObjectTools.cachedMethodUrl= cachedMethodUrl;
DataObjectTools.convertToMongo= convertToMongo;
DataObjectTools.convertFromMongo= convertFromMongo;

