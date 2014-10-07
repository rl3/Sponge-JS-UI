
var dataCache= new Meteor.Collection('Cache');
var dataCacheMeta= new Meteor.Collection('CacheMeta');
var sessionData= new Meteor.Collection('SessionData')

var Future;

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
            return isAdmin() || userId === doc._id;
        },
        remove: isAdmin,
    });

    // deny all changes except in user's profile (or role for admins)
    Meteor.users.deny({
        update: function( userId, doc, fieldNames, modifier ) {
            return fieldNames.filter(function( name ) {
                if ( name === 'roles' && isAdmin() ) return false;

                return name !== 'profile';
            }).length;
        }
    });

    sessionData.remove({});
});

/*
 *  function to build user/session selector
 *  to be called within publish and methods functions with respective 'this' object
 */
var buildSessionSelector= function( meteorObject, noAuth ) {
    if ( noAuth ) return { userId: null };

    return {
        userId: meteorObject.userId,
        session: meteorObject.connection.id,
    };
};

var buildSessionSelectorForMethod= function( connection, noAuth ) {
    return buildSessionSelector({
        userId: Meteor.userId(),
        connection: connection,
    }, noAuth);
};

var buildCacheSelector= function( meteorObject, noAuth ) {
    return { userId: noAuth ? null : meteorObject.userId };
};

Meteor.publish('client-cache', function() {
    var query= buildSessionSelector(this);
    var cacheQuery= { userId: { $in: [ null, this.userId ] } };

    var admin= Meteor.users.findOne({ _id: this.userId, roles: 'admin' });

    return [
        dataCache.find(cacheQuery),
        dataCacheMeta.find(cacheQuery),
        sessionData.find(query),
        Meteor.users.find(admin ? {} : { _id: this.userId }, { fields: { username: true, roles: true, profile: true, } }),
    ];
});

var Debug= false;
var debugFilter;

//Debug= true;
//debugFilter= /Job\/getJobs/;

var addHeaders= function( options, connection ) {
    options= SpongeTools.clone(options);
    if ( !options.headers ) options.headers= {};

    var forwardedFor= connection.httpHeaders && connection.httpHeaders['x-forwarded-for'];

    options.headers['x-forwarded-for']= (forwardedFor ? forwardedFor + ',' : '' ) + connection.clientAddress;
    return options;
};

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

var authenticate= function( runFn, connection ) {
    var auth= getAuth();
    if ( !auth ) return;

    authenticationQueue.push(runFn);
    if ( authenticationQueue.length > 1 ) return;

    var sessionSelector= buildSessionSelectorForMethod(connection);
    console.log('authenticate...', auth);
    return HTTP.call('GET', baseUrl + authUrl, addHeaders({ auth: auth }, connection), function( err, result ) {
        console.log('authenticateing done', result)

        var data= _.extend(SpongeTools.clone(sessionSelector), { baseUrl: baseUrlExt || baseUrl, token: err ? null : result.data.token });

        sessionData.upsert(sessionSelector, data, function() {
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
                return authenticate(runCall, options.connection);
            }
        }
        if ( callback ) return callback.call(this, err, result);
    };

    var runCall= function( err ) {
        if ( err ) return callback(err);

        var sd= sessionData.findOne(buildSessionSelectorForMethod(options.connection));

        var _options= SpongeTools.clone(options);
        delete _options.connection;

        if ( sd && sd.token ) setCookie(_options, 'RestSessionId', sd.token);

        if ( Debug ) {
            if ( debugFilter && url.match(debugFilter) ) {
                console.log('API call', method, url, _options.data || '');
            }
        }

        return HTTP.call(method, baseUrl + url, addHeaders(_options, options.connection), cb);
    };
    runCall();
};

var _request= function( method, url, options, callback ) {

    options= EJSON.toJSONValue(options);

    url= SpongeTools.cleanUrl(url);

    var cb= function( err, result ) {
        delete options.connection;
        console.log('API result', method, url, JSON.stringify(options));
        if ( err ) console.log('error', err);

        result= EJSON.fromJSONValue(result || {});
        if ( Debug ) {
            if ( !debugFilter || url.match(debugFilter) ) {
//                console.log('result', result);
                console.log('data', url, result.data);
            }
        }
        if ( callback ) return callback.call(this, err, result);
    };

    return _authenticatedRequest(method, url, options, cb);
};

var get= function( url, data, connection, callback ) {
    return _request('GET', url, { connection: connection }, callback);
};

var post= function( url, data, connection, callback ) {
    return _request('POST', url, { data: data || null, connection: connection }, callback);
};

var put= function( url, data, connection, callback ) {
    return _request('PUT', url, { data: data || null, connection: connection }, callback);
};

var del= function( url, data, connection, callback ) {
    return _request('DELETE', url, { data: data || null, connection: connection }, callback);
};

var methods= {};

['Model', 'ModelTemplate'].forEach(function( type ) {
    methods['save' + type]= function( model ) {
        var cacheSelector= buildCacheSelector(this);
        return put(type + '/save', model, this.connection, function( err, result ) {
            if ( err ) return;

            var id= model._id;
            if ( !id ) return;

            var key= SpongeTools.buildCacheKey(SpongeTools.getCachedMethodData('get' + type, [id]));

            updateCache(key, cacheSelector, model);
        });
    };
});

methods.setJobTitle= function( data ) {
    var self= this;
    return put('Job/setTitle/' + data.jobId, { title: data.title }, this.connection, function( err, result ) {
        if ( err ) return;

        methods.getJob.call(self, data.jobId);
    });
};

methods.setJobDescription= function( data ) {
    var self= this;
    return put('Job/setDescription/' + data.jobId, { description: data.description }, this.connection, function( err, result ) {
        if ( err ) return;

        methods.getJob.call(self, data.jobId);
    });
};


var onBeforeMethod= {};
var onAfterMethod= {};

var getInstances= {};

/*
 * remove all cache instances for a given method for all users
 */
var removeFromCache= function() {
    var methodSelf= this;
    var args= Array.prototype.slice.call(arguments);
    var name= args.shift();
    var urlData= SpongeTools.getCachedMethodData(name, args);

    var key= SpongeTools.buildCacheKey(urlData);

    dataCacheMeta.remove({ key: key });
    dataCache.remove({ key: key });
    return;
};

SpongeTools.getCachedMethodNames().forEach(function( name ) {
    methods[name]= function( /* arguments */ ) {
        var methodSelf= this;
        var args= Array.prototype.slice.call(arguments);
        var urlData= SpongeTools.getCachedMethodData(name, args);

        // run onBeforeMethod with options and return on false
        if ( name in onBeforeMethod && !onBeforeMethod[name].apply(this, args) ) return;

        var key= SpongeTools.buildCacheKey(urlData);

        var instanceKey= urlData.instanceKey ? urlData.instanceKey : key;

        var userId= urlData.noAuth ? null : Meteor.userId();

        var running= instanceKey in getInstances;

        getInstances[instanceKey]= urlData.lastInstance ? {
            key: key,
            args: args,
        } : undefined;

        if ( running ) return;

        var fn;
        switch ( (urlData.method || '').toLowerCase() ) {
            case 'post': fn= post; break;
            case 'put': fn= put; break;
            case 'del': fn= del; break;
            default: fn= get; break;
        }

        // delete semaphore and re-run last invocation, if lastInstance is required and keys don't match
        var finishFn= function() {
            if ( !(instanceKey in getInstances) ) {
                console.error('Did not found instanceKey "' + instanceKey + '" in getInstances! This should never happen.');
                return;
            }

            var lastInstance= getInstances[instanceKey];

            // delete running instance after one second to allow propagation of db changes
            setTimeout(function() {
                delete getInstances[instanceKey];
            }, 1000);

            if ( !urlData.lastInstance || key === lastInstance.key ) return;

            return methods[name].apply(methodSelf, lastInstance.args);
        };

        var cacheSelector= buildCacheSelector(this, urlData.noAuth);
        return fn(urlData.url, urlData.data, this.connection, function( err, result ) {
            if ( err ) return finishFn();

            var data= urlData.dataFormat === 'plain' ? result : result.data;

            // run onAfterMethod with options and data and set data with result
            if ( name in onAfterMethod) {
                var afterArgs= args.slice();
                afterArgs.push(data);
                data= onAfterMethod[name].apply(methodSelf, afterArgs);
            }

            switch ( urlData.dataStore ) {
                case 'file':
                    var fs = Npm.require('fs');
                    var temp= SpongeTools.mktemp();

                    fs.writeFileSync(temp.localname, data.content);

                    delete data.content;
                    data.url= temp.url;
                    // fall through
                default:
                    if ( urlData.noResult ) return finishFn();

                    return updateCache(key, cacheSelector, SpongeTools.convertToMongo(data), function( err ) {
                        return finishFn();
                    });
            }

        });
    };
});

methods.getJobLog= function( jobId ) {
    var connection= this.connection;
    return async(function( cb ) {
        return _authenticatedRequest('GET', 'Job/log/' + jobId, { connection: connection }, cb);
    });
};

methods.deleteJobLog= function( jobId ) {
    var connection= this.connection;
    return async(function( cb ) {
        return _authenticatedRequest('DELETE', 'Job/log/' + jobId, { connection: connection }, cb);
    });
};

methods.getResultTable= function( jobId, tablePath, format ) {
    var connection= this.connection;
    return async(function( cb ) {
        return _authenticatedRequest('GET', 'Job/getResultTable/' + jobId + '/' + tablePath + '?format=' + (format || 'xml'), { connection: connection }, cb);
    });
};

Meteor.methods(methods);

var updateCache= function( key, query, newData, cb ) {
    if ( !cb ) cb= function() {};

    if ( newData === undefined ) newData= null;

    query.key= key;

    return dataCacheMeta.upsert(query, _.extend({ timeStamp: new Date(), }, query), function() {
        // update data only if changed
        var oldData= dataCache.findOne(query);
        if ( oldData && _.isEqual(oldData.data, newData) ) return cb();

        return dataCache.upsert(query, _.extend({ data: newData, }, query), cb);
    });
};


onAfterMethod.restartJob=
onAfterMethod.removeJob= function( jobId ) {
console.log('invalidate', jobId)
    removeFromCache('getJob', jobId);
//    methods.getJob.call(this, jobId);
};

onAfterMethod.addAcl=
onAfterMethod.removeAcl= function( collection, id, acls ) {
console.log('invalidate ACLs', collection, id)
    removeFromCache('getAcl', collection, id);
//    methods.getAcl.call(this, collection, id);
};


