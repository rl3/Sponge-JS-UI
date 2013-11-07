Meteor.startup(function() {
    Future = Npm.require('fibers/future');
});

var Debug= false;

var baseUrl= CONFIG.baseurl;
var authUrl= CONFIG.authurl;
//var auth= CONFIG.auth;

var getAuth= function() {
    var user= Meteor.user();
    if ( !user || !user.profile || !user.profile.agrohyd ) return;

    var apiUser= user.profile.agrohyd.apiUser;
    var apiPassword= user.profile.agrohyd.apiPassword;

    if ( !apiUser || !apiPassword ) return;

    return apiUser + ':' + apiPassword;
};

var async= function( fn ) {
    var future= new Future();
    fn(function( err, result ) {
        future.ret(result);
    });
    return future.wait();
};

var authTokens= {};

var authenticationQueue= [];

var authenticate= function( runFn ) {
    var auth= getAuth();
    if ( !auth ) return;

    authenticationQueue.push(runFn);
    if ( authenticationQueue.length > 1 ) return;

    console.log('authenticate...', auth);
    return Meteor.http.call('GET', baseUrl + authUrl, { auth: auth }, function( err, result ) {
console.log('authenticateing done', result)

        if ( !err ) authTokens[Meteor.userId()]= result.data.token;

        while( authenticationQueue.length ) authenticationQueue.shift()(err);
    });
};

var setCookie= function( options, name, value ) {
    if ( !options.headers ) options.headers= {};
    if ( !('Cookie' in options.headers) ) options.headers.Cookie= '';
    options.headers.Cookie+= name + '=' + value + ';';
};

/*
 *  try to use authentication token. If failed, authenticate and save new token
 */
var _authenticatedRequest= function( method, url, options, callback ) {
    if ( !options ) options= {};

    var authCounter= 2;
    var cb= function( err, result ) {
        if ( err && err.response && err.response.statusCode ) {
            var auth= getAuth();
            if ( auth && err.response.statusCode == 401 && authCounter-- ) {
                return authenticate(runCall);
            }
        }
        if ( callback ) return callback.call(this, err, result);
    };

    var runCall= function( err ) {
        if ( err ) return callback(err);

        var authToken= authTokens[Meteor.userId()];

        if ( authToken ) setCookie(options, 'RestSessionId', authToken);

        return Meteor.http.call(method, baseUrl + url, options, cb);
    };
    runCall();
};

var _request= function( method, url, options, callback ) {

    options= EJSON.toJSONValue(options);

    var cb= function( err, result ) {
        console.log(method + ' result', url, JSON.stringify(options));
        result= EJSON.fromJSONValue(result || {});
        if ( Debug ) {
//            console.log('headers', d.headers);
            console.log('data', url, result.data);
        }
        if ( callback ) return callback.call(this, err, result);
    };

    return _authenticatedRequest(method, url, options, cb);
};

var get= function( url, data, callback ) {
    return _request('GET', url, {}, callback);
};

var post= function( url, data, callback ) {
    return _request('POST', url, { data: data || null }, callback);
};

var put= function( url, data, callback ) {
    return _request('PUT', url, { data: data || null }, callback);
};

var del= function( url, data, callback ) {
    return _request('DELETE', url, { data: data || null }, callback);
};

var methods= {};

['Model', 'ModelTemplate'].forEach(function( type ) {
    methods['save' + type]= function( model ) {
        return put(type + '/save', model, function( err, result ) {
            if ( err ) return;

            var id= model._id;
            if ( !id ) return;

            var url= DataObjectTools.cachedMethodUrl['get' + type](id);

            if ( typeof url === 'object' ) url= JSON.stringify(url);

            updateCache(url, model);
        });
    };
});

Meteor.startup(function() {
    DataObjectTools.dataCache.remove({});
    DataObjectTools.dataCacheMeta.remove({});
});


var onBeforeMethod= {};
var onAfterMethod= {};

var getInstances= {};

Object.keys(DataObjectTools.cachedMethodUrl).forEach(function( name ) {
    methods[name]= function( /* arguments */ ) {
        var args= Array.prototype.slice.call(arguments);
        var _urlData= DataObjectTools.cachedMethodUrl[name].apply(DataObjectTools.cachedMethodUrl, args);

        // run onBeforeMethod with options and return on false
        if ( name in onBeforeMethod && !onBeforeMethod[name].apply(null, args) ) return;

        var key= typeof _urlData === 'object' ? JSON.stringify(_urlData) : _urlData;

        if ( key in getInstances ) return;

        getInstances[key]= undefined;

        var urlData;

        if ( typeof _urlData === 'object' ) {
            urlData= _.clone(_urlData);
        }
        else {
            urlData= {
                url: _urlData,
                data: null,
                method: 'GET',
            };
        }

        var fn= post;
        switch ( (urlData.method || '').toLowerCase() ) {
            case 'get': fn= get; break;
            case 'put': fn= put; break;
            case 'del': fn= del; break;
        }

        return fn(urlData.url, urlData.data, function( err, result ) {
            if ( err ) {
                delete getInstances[key];
                return;
            }

            var data= result.data;

            // run onAfterMethod with options and data and set data with result
            if ( name in onAfterMethod) {
                var afterArgs= args.slice();
                afterArgs.push(data);
                data= onAfterMethod[name].apply(null, args);
            }

            updateCache(key, DataObjectTools.convertToMongo(data), function( err ) {
                delete getInstances[key];
            });
        });
    };
});

methods.getJobLog= function( jobId ) {
    return async(function( cb ) {
        return _authenticatedRequest('GET', 'Job/log/' + jobId, {}, cb);
    });
};

methods.deleteJobLog= function( jobId ) {
    return async(function( cb ) {
        return _authenticatedRequest('DEL', 'Job/log/' + jobId, {}, cb);
    });
};

methods.getResultTable= function( jobId, tablePath, format ) {
    return async(function( cb ) {
        return _authenticatedRequest('GET', 'Job/getResultTable/' + jobId + '/' + tablePath + '?format=' + (format || 'xml'), {}, cb);
    });
};

Meteor.methods(methods);

var updateCache= function( id, newData, cb ) {
    if ( !cb ) cb= function() {};

    if ( newData === undefined ) newData= null;

    var afterMetaUpdate= function() {
        // update data only if changed
        var oldData= DataObjectTools.dataCache.findOne({ _id: id });
        if ( oldData && _.isEqual(oldData.data, newData) ) return cb();

        if ( oldData ) {
            return DataObjectTools.dataCache.update({ _id: id }, { $set: { data: newData }, }, cb);
        }
        return DataObjectTools.dataCache.insert({ _id: id, data: newData }, cb);
    };

    // update meta data in every case
    var oldMetaData= DataObjectTools.dataCacheMeta.findOne({ _id: id });
    if ( oldMetaData ) {
        return DataObjectTools.dataCacheMeta.update({ _id: id }, { $set: { timeStamp: new Date() }, }, afterMetaUpdate);
    }
    return DataObjectTools.dataCacheMeta.insert({ _id: id, timeStamp: new Date() }, afterMetaUpdate);
};


onAfterMethod.restartJob= function( jobId ) {
console.log('invalidate', jobId)
    methods.getJob(jobId);
};
onAfterMethod.removeJob= function( jobId ) {
console.log('invalidate', jobId)
    methods.getJob(jobId);
};


