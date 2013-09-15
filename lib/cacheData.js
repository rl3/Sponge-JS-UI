
var dataCache= new Meteor.Collection("Cache");

var cachedMethodUrl= {
    'getTypeVersions':         function( options ) { return 'Schema/getAllTypeVersion'; },
    'getSchemaByTypeVersion':  function( options ) { return 'Schema/getByTypeVersion/' + options.type + '/' + options.version; },
    'getAllSchemas':           function( options ) { return 'Schema/getAll'; },
    'getIdNamesByTypeVersion': function( options ) { return 'AgroObjRaw/getIdNamesByTypeVersion/' + options.type + '/' + options.version; },
    'getAgroObject':           function( id )      { return 'AgroObj/getByObjectId/' + id; },
    'getParameterSetCount':    function( id )      { return 'ParameterSetRaw/getCount/' + id; },
    'getParameterSets':        function( options ) { return 'ParameterSetRaw/getAllKeyOrdered/' + options.id + '/' + options.start + '/' + options.count; },

    'getModelArgs':            function( modelId ) { return 'Model/getArgs/' + modelId.toHexString(); },
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
            modelId:    options.modelId,
            inArgs:     options.args,
        },
        method: 'PUT',
    }; },
};

['Model', 'ModelTemplate'].forEach(function( type ) {
    cachedMethodUrl['get' + type + 'Count']= function( options ) { return type + '/getCount'; };
    cachedMethodUrl['get' + type + 's']=     function( options ) { return type + '/getAllPart/' + (options.start || 0) + '/' + (options.count || 100); };
    cachedMethodUrl['get' + type + 'Names']= function( options ) { return type + '/getNames'; };
    cachedMethodUrl['get' + type]=           function( id )      { return type + '/getByObjectId/' + id; };
});

DataObjectTools.dataCache= dataCache;
DataObjectTools.cachedMethodUrl= cachedMethodUrl;
