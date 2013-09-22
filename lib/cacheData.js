
var dataCache= new Meteor.Collection("Cache");

var oid2Str= function( oid ) {
    return !oid ? null : typeof oid === 'object' ? oid.toHexString() : String(oid);
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
            modelId:    oid2Str(options.modelId),
            inArgs:     options.args,
        },
        method: 'PUT',
    }; },
    'getJobs':                 function( options ) { return 'Job/getJobs/' + (options.userId ? oid2Str(options.userId) : 0) + '/' + (options.modelId ? oid2Str(options.modelId) : 0); },
    'getJob':                  function( jobd )    { return 'Job/getJobById/' + jobId; },
};

['Model', 'ModelTemplate'].forEach(function( type ) {
    cachedMethodUrl['get' + type + 'Count']= function( options ) { return type + '/getCount'; };
    cachedMethodUrl['get' + type + 's']=     function( options ) { return type + '/getAllPart/' + (options.start || 0) + '/' + (options.count || 100); };
    cachedMethodUrl['get' + type + 'Names']= function( options ) { return type + '/getNames'; };
    cachedMethodUrl['get' + type]=           function( id )      { return type + '/getByObjectId/' + oid2Str(id); };
});

DataObjectTools.dataCache= dataCache;
DataObjectTools.cachedMethodUrl= cachedMethodUrl;
