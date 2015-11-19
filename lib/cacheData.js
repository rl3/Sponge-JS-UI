
var oid2Str= function( oid ) {
    return oid instanceof Meteor.Collection.ObjectID ? oid.toHexString() : String(oid);
};

var _toStr= function( value ) {
    if ( value instanceof Date ) return value.toISOString();
    return oid2Str(value);
}

var str2Oid= function( str ) {
    if ( str instanceof Meteor.Collection.ObjectID ) return str;

    if ( !str || String(str).length !== 24 ) return null;
    try {
        return new Meteor.Collection.ObjectID(String(str));
    }
    catch ( e ) {}
    return null;
};


var _flattenValue= function( value, dontEncode ) {
    var __toStr= _toStr;
    if ( !dontEncode ) {
        var objectSeparator= encodeURIComponent(':');
        __toStr= function( value ) {
            return _toStr(value).replace(/:/g, objectSeparator);
        };
    }

    if ( _.isArray(value) ) return value.map(__toStr).join('-');

    // iterator value
    if ( value && typeof value === 'object' && value.constructor === Object ) {
        var objectSeparator= ':';
        if ( !dontEncode ) objectSeparator= encodeURIComponent(objectSeparator);

        return Object.keys(value).map(function( name ) { return name + objectSeparator + __toStr(value[name]); }).join(',');
    }

    return _toStr(value);
};

var _joinFlattenValue= function( value ) {
    return _flattenValue(value, false);
};

var join= function( /*args*/ ) {
    var args= Array.prototype.slice.call(arguments);
    return args.map(_joinFlattenValue).join('/');
};

var query= function( params ) {
    if ( !params ) return '';

    var keys= Object.keys(params);

    if ( !keys.length ) return ''

    return '?' + keys.map(function( key ) {
        return encodeURIComponent(key) + '=' + ( params[key] === undefined || params[key] === null ? '' : encodeURIComponent(_flattenValue(params[key], true)) );
    }).join('&');
};

var cachedMethodUrl= {
    'getTypeVersions':         function( options ) { return 'Schema/getAllTypeVersion'; },
    'getSchemaByTypeVersion':  function( options ) { return join('Schema/getByTypeVersion', options.type, options.version); },
    'getAllSchemas':           function( options ) { return 'Schema/getAll'; },
    'getIdNamesByTypeVersion': function( options ) { return join('DataObjRaw/getIdNamesByTypeVersion', options.type, options.version); },
    'getDataObject':           function( id )      { return join('DataObj/get', id); },
    'getParameterSetCount':    function( id )      { return join('ParameterSetRaw/getCount', id); },
    'getParameterSets':        function( options ) { return join('ParameterSetRaw/getAllKeyOrdered', options.id, options.start, options.count); },

    'getModelArgs':            function( modelId ) { return join('Model/getArgs', modelId); },
    'getMatchingTypes':        function( type )    { return { url: 'Model/getCompatibleTypesByType', data: {type: type}, method: 'POST', }; },
    'getTagsByTypeVersion':    function( objectType, versions ) {
        if ( _.isArray(versions) ) versions= versions.join('-');
        return join('DataObj/getTagsByTypeVersion', objectType, versions);
    },
    'getMapnamesByTypeVersion':    function( objectType, versions ) {
        return join('DataObj/getMapnamesByTypeVersion', objectType, versions || 0);
    },
    'getMatchingObjects':      function( options ) { return {
        url: 'DataObj/getByTypeVersionName',
        data: {
            objectType: options.objectType,
            version:    options.versions,
            name:       options.name,
            limit:      options.limit || 100,
        },
        method: 'POST',
    }; },
    'getObjectsByLocation':    function( objectType, versions, area ) {
        return {
            url: join('Point/getByTagTypeVersion', 'all', objectType, versions) + query({ left: area.west, top: area.north, right: area.east, bottom: area.south, format: 'json' }),
            instanceKey: 'Point/getByTagTypeVersion',
            lastInstance: true,
        };
    },

    'startJob':                function( modelId, args, details ) { return {
        url: 'Job/startJob',
        data: {
            modelId:    str2Oid(modelId),
            inArgs:     args,
            jobDetails: details,
        },
        method: 'PUT',
        noResult: true,
    }; },
    'getJobs':                 function( options ) { return join('Job/getJobs', options.userId || '0',  options.modelId); },
    'getJob':                  function( jobId )   { return join('Job/getByJobId', jobId); },
    'getJobResult':            function( jobId, path ) { return join('Job/getResult', jobId); },
    'getJobResultMapArgs':     function( jobId, path ) { return join('Job/getResultMapArgs', jobId, path); },
    'getJobResultMap':         function( jobId, path, data, format ) { return {
        url: join('Job/getResultMap', jobId, path) + query({ format: format || 'kml', delivery: 'url' }),
        data: data,
        method: 'PUT',
    }; },
    'restartJob':              function( jobId )   { return join('Job/restartJob', jobId); },
    'deleteJob':               function( jobId )   { return join('Job/removeJobById', jobId); },
    'deleteResult':            function( jobId, resultId ) { return join('Job/deleteResult', jobId, resultId); },
    'getArchiveModel':         function( modelId, jobId )  { return join('Model/getArchive', modelId, jobId); },
    'deleteArchive':           function( jobId )   { return join('Model/removeArchive', jobId); },
    'getJobQueue':             function()          { return {
        url: 'Job/getJobQueue',
        noAuth: true,
    }; },
    'removeJobFromQueue':      function( jobId )   { return join('Job/removeJobFromQueue', jobId); },

    'getAcl':                  function( collection, id )   { return join(collection, 'getAcl', id); },
    'addAcl':                  function( collection, id, acls ) { return join(collection, 'addAcl', id, acls.join('%2C')); },
    'removeAcl':               function( collection, id, acls ) { return join(collection, 'removeAcl', id, acls.join('%2C')); },
    'getAllUserNames':         function()          { return 'SourceTemplate/getAllUserNames'; },
    'getAllGroupNames':        function()          { return 'SourceTemplate/getAllGroups'; },
    'getMap':                  function( mapId )   { return join('Map/getMap', mapId); },

    'exportRawByDataObjId':    function( id, start, end, format ) {
        return join('ParameterSetData/exportByDataObjId', id)        + query({ format: format || 'xml', delivery: 'url' });
    },
    'exportSingleByDataObjId': function( id, iterator, dummy1, dummy2, format )   {
        return join('ParameterSetData/getByDataObjId', id, iterator) + query({ format: format || 'xml', delivery: 'url' });
    },
    'exportByDataObjId':       function( id, start, end, step, format ) {
        return join('ParameterSetData/getByDataObjId', id, start)    + query({ end: end, step: step, format: format || 'xml', delivery: 'url' });
    },
    'exportByTagTypeLocation': function( tag, type, lon, lat, start, end, step, format ) {
        return join('ParameterSetData/getByTagTypeLocation', tag, type, lon, lat, start)    + query({ end: end, step: step, format: format || 'xml', delivery: 'url' });
    },
    'exportByMapTypeLocation': function( mapId, type, lon, lat, start, end, step, format ) {
        return join('ParameterSetData/getByMapTypeLocation', mapId, type, lon, lat, start)    + query({ end: end, step: step, format: format || 'xml', delivery: 'url' });
    },
};

['Model', 'ModelTemplate'].forEach(function( type ) {
    cachedMethodUrl['get' + type + 'Count']= function( options ) { return join(type, 'getCount'); };
    cachedMethodUrl['get' + type + 's']=     function( options ) { return join(type, 'getAllPart', options.start || 0, options.count || 100); };
    cachedMethodUrl['get' + type + 'Names']= function( options ) { return join(type, 'getNames'); };
    cachedMethodUrl['get' + type]=           function( id )      { return join(type, 'get', id); };
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

var buildCacheKey= function( urlData, noAuth ) {
    var keys= [(urlData.method || 'GET').toUpperCase(), urlData.url];

    if ( urlData.data ) keys.push(JSON.stringify(urlData.data));

    return keys.join(':');
};


var getCachedMethodData= function( name, args ) {
    var urlData= cachedMethodUrl[name].apply(null, args);

    if ( typeof urlData === 'object' ) return urlData;

    return {
        url: urlData,
        method: 'GET',
        data: null,
    };
};

SpongeTools.oid2Str= oid2Str;
SpongeTools.str2Oid= str2Oid;

SpongeTools.getCachedMethodData= getCachedMethodData;
SpongeTools.convertToMongo= convertToMongo;
SpongeTools.convertFromMongo= convertFromMongo;
SpongeTools.buildCacheKey= buildCacheKey;
SpongeTools.getCachedMethodNames= function() { return Object.keys(cachedMethodUrl); };
SpongeTools.ErrorCacheKey= '*****ERROR*****';
