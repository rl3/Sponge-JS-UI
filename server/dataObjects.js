
var dataCache= new Meteor.Collection('Cache');
var dataCacheMeta= new Meteor.Collection('CacheMeta');
var sessionData= new Meteor.Collection('SessionData')

Meteor.startup(function() {
    Future = Npm.require('fibers/future');
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    dataCache.remove({});
    dataCacheMeta.remove({});

    var deny= {
        insert: function() { return true; },
        update: function() { return true; },
        remove: function() { return true; },
    };
    dataCache.deny(deny);
    dataCacheMeta.deny(deny);
    sessionData.deny(deny);

    var isAdmin= SpongeTools.isAdmin;

    Meteor.users.allow({
        insert: isAdmin,
        update: function( userId, doc, fieldNames, modifier ) {
            if ( isAdmin() ) return true;

            if ( userId !== doc._id ) return false;

            return true;
        },
        remove: isAdmin,
    });

    // deny all changes except in user's profile
    Meteor.users.deny({
        update: function( userId, doc, fieldNames, modifier ) {
            return fieldNames.filter(function( name ) { return name !== 'profile' }).length;
        }
    });
});

Meteor.publish('client-cache', function() {
    var query= { userId: this.userId };

    var admin= Meteor.users.findOne({ _id: this.userId, roles: 'admin' });

    return [
        dataCache.find(query),
        dataCacheMeta.find(query),
        sessionData.find(query),
        Meteor.users.find(admin ? {} : { _id: this.userId }, { fields: { username: true, roles: true, profile: true, } }),
    ];
});

var Debug= false;
// Debug= true;

var baseUrl= SpongeTools.Config.baseurl;
var baseUrlExt= SpongeTools.Config.baseurlExternal;
var authUrl= SpongeTools.Config.authurl;

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
        future.return(result);
    });
    return future.wait();
};

var authenticationQueue= [];

var authenticate= function( runFn ) {
    var auth= getAuth();
    if ( !auth ) return;

    authenticationQueue.push(runFn);
    if ( authenticationQueue.length > 1 ) return;

    console.log('authenticate...', auth);
    return HTTP.call('GET', baseUrl + authUrl, { auth: auth, }, function( err, result ) {
        console.log('authenticateing done', result)

        sessionData.upsert({ userId: Meteor.userId() }, { userId: Meteor.userId(), baseUrl: baseUrlExt || baseUrl, token: err ? null : result.data.token }, function() {
            while( authenticationQueue.length ) authenticationQueue.shift()(err);
        });
    });
};

var setCookie= function( options, name, value ) {
    if ( !options.headers ) options.headers= {};
    if ( !('Cookie' in options.headers) ) options.headers.Cookie= '';

    var cookies= {};
    options.headers.Cookie.split(';').forEach(function( cookie ) {
        if ( !cookie ) return;

        var parts= cookie.split('=', 1);
        cookies[parts[0]]= parts[1];
    });

    cookies[name]= value;

    options.headers.Cookie= Object.keys(cookies).map(function( name ) {
        return name + '=' + cookies[name]
    }).join(';');
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

        var sd= sessionData.findOne({ userId: Meteor.userId() });

        var _options= SpongeTools.clone(options);

        if ( sd && sd.token ) setCookie(_options, 'RestSessionId', sd.token);

        return HTTP.call(method, baseUrl + url, _options, cb);
    };
    runCall();
};

var _request= function( method, url, options, callback ) {

    options= EJSON.toJSONValue(options);

    var cb= function( err, result ) {
        console.log(method + ' result', url, JSON.stringify(options));
        if ( err ) console.log('error', err);

        result= EJSON.fromJSONValue(result || {});
        if ( Debug ) {
//            console.log('result', result);
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

            var url= SpongeTools.cachedMethodUrl['get' + type](id);

            if ( typeof url === 'object' ) url= JSON.stringify(url);

            updateCache(url, model);
        });
    };
});


var onBeforeMethod= {};
var onAfterMethod= {};

var getInstances= {};

Object.keys(SpongeTools.cachedMethodUrl).forEach(function( name ) {
    methods[name]= function( /* arguments */ ) {
        var args= Array.prototype.slice.call(arguments);
        var _urlData= SpongeTools.cachedMethodUrl[name].apply(SpongeTools.cachedMethodUrl, args);

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

            updateCache(key, SpongeTools.convertToMongo(data), function( err ) {
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
        return _authenticatedRequest('DELETE', 'Job/log/' + jobId, {}, cb);
    });
};

methods.getResultTable= function( jobId, tablePath, format ) {
    return async(function( cb ) {
        return _authenticatedRequest('GET', 'Job/getResultTable/' + jobId + '/' + tablePath + '?format=' + (format || 'xml'), {}, cb);
    });
};

Meteor.methods(methods);

var updateCache= function( key, newData, cb ) {
    if ( !cb ) cb= function() {};

    if ( newData === undefined ) newData= null;

    var userId= Meteor.userId();

    var query= { key: key, userId: userId, };

    return dataCacheMeta.upsert(query, _.extend({ timeStamp: new Date(), }, query), function() {
        // update data only if changed
        var oldData= dataCache.findOne(query);
        if ( oldData && _.isEqual(oldData.data, newData) ) return cb();

        return dataCache.upsert(query, _.extend({ data: newData, }, query), cb);
    });
};


onAfterMethod.restartJob= function( jobId ) {
console.log('invalidate', jobId)
    methods.getJob(jobId);
};
onAfterMethod.removeJob= function( jobId ) {
console.log('invalidate', jobId)
    methods.getJob(jobId);
};


