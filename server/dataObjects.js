
var dataCache= new Meteor.Collection('Cache');
var dataCacheMeta= new Meteor.Collection('CacheMeta');
var sessionData= new Meteor.Collection('SessionData')

// userId to be used for any user (data that should not be cached for every user separately)
var anyUserId= 'any';

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
    Meteor.users.deny(deny);

    sessionData.remove({});
});

/*
 *  function to build user/session selector
 *  to be called within publish and methods functions with respective 'this' object
 */
var buildSessionSelector= function( meteorObject, noAuth ) {
    return { userId: noAuth ? anyUserId : meteorObject.userId };
};

var buildSessionSelectorForMethod= function( noAuth ) {
    return buildSessionSelector({
        userId: Meteor.userId(),
    }, noAuth);
};

var buildCacheSelector= function( meteorObject, noAuth ) {
    return { userId: noAuth ? anyUserId : meteorObject.userId };
};

/**
 * Restrict client's access to db
 */
Meteor.publish('client-cache', function() {
    var query= buildSessionSelector(this);
    var cacheQuery= { userId: { $in: [ anyUserId, this.userId ] } };
    var admin= Meteor.users.findOne({ _id: this.userId, roles: 'admin' });

    return [
        dataCache.find(cacheQuery),
        dataCacheMeta.find(cacheQuery),
        sessionData.find(query),
        Meteor.users.find(admin ? {} : { _id: this.userId }, { fields: { username: true, roles: true, profile: true } }),
    ];
});

var Debug= false;
var debugFilter;

// Debug= true;
// debugFilter= /getAllUser/;

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

var async= function( fn ) {
    var future= new Future();
    fn(function( err, result ) {
        future.return(result);
    });
    return future.wait();
};

var async2= function( fn ) {
    var future= new Future();
    fn(function( err, result ) {
        future.return([err, result]);
    });
    return future.wait();
};

var logout= function( cb ) {

    // Log all instances of this user out
    return Meteor.users.update({ _id: Meteor.userId() }, {$set : { "services.resume.loginTokens" : [] }}, cb || function() {});
};

Accounts.registerLoginHandler('SpongeApi', function( loginRequest ) {
    // there are multiple login handlers in meteor.
    // a login request go through all these handlers to find it's login hander
    // so in our login handler, we only consider login requests which has admin field

    if ( loginRequest.method !== 'agrohyd-api' ) return;

    var username= loginRequest.username;
    var password= loginRequest.password;
    if ( !username || !password ) return;

    var connection= this.connection;
    var r= async2(function( cb ) { authenticate(username, password, connection, cb) });

    if ( r[0] || !r[1] ) return; // r[0];

    var userData= {
        profile: r[1].template,
        roles: r[1].roles,
    };

    //we create a admin user if not exists, and get the userId
    var userId = null;
    var user = Meteor.users.findOne({ username: username });
    if( !user ) {
        userId = Meteor.users.insert({ username: username });
    }
    else {
        userId = user._id;
    }

    //creating the token and adding to the user
    var stampedToken = Accounts._generateStampedLoginToken();

    //hashing is something added with Meteor 0.7.x, 
    //you don't need to do hashing in previous versions
    var hashStampedToken = Accounts._hashStampedToken(stampedToken);

    Meteor.users.update(userId, { $set: userData, $push: { 'services.resume.loginTokens': hashStampedToken } });

    var sessionSelector= buildSessionSelector({
        userId: userId,
    });

    var data= _.extend(SpongeTools.clone(sessionSelector), {
        baseUrl: baseUrlExt || baseUrl,
        token: r[1].token,
        username: username,
        template: userData.profile,
        roles: userData.roles,
    });

    sessionData.upsert(sessionSelector, data);

    //sending token along with the userId
    return {
        userId: userId,
        token: stampedToken.token
    };
});

var authenticate= function( username, password, connection, cb ) {
    if ( !username || !password ) return;
    var auth= username + ':' + password;

    console.log('authenticate...', auth.replace(/:.+$/, ':********'));
    return HTTP.call('GET', baseUrl + authUrl, addHeaders({ auth: auth }, connection), function( err, result ) {
        if ( err ) {
            console.error('authentication FAILED. Error:', err);
        }
        else {
            console.log('authentication done. Token:', result.data.token);
        }

        return cb(err, result.data);
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
            if ( err.response.statusCode == 401 ) {
                console.log('Permission denied. Logging out...', url);

                return logout(callback.bind(this, err));
            }
        }
        if ( callback ) return callback.call(this, err, result);
    };

    var runCall= function( err ) {
        if ( err ) return callback(err);

        var sessionSelector= buildSessionSelectorForMethod();
        var sd= sessionData.findOne(sessionSelector);

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

var _request= function( method, url, options, cacheSelector, callback ) {

    options= EJSON.toJSONValue(options);

    url= SpongeTools.cleanUrl(url);

    var cb= function( err, result ) {
        delete options.connection;
        console.log('API result', method, url, JSON.stringify(options));
        if ( err ) {
            updateCacheError(url, cacheSelector, err);
            console.log('error', err);
        }

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

var get= function( url, data, connection, cacheSelector, callback ) {
    return _request('GET', url, { connection: connection }, cacheSelector, callback);
};

var post= function( url, data, connection, cacheSelector, callback ) {
    return _request('POST', url, { data: data || null, connection: connection }, cacheSelector, callback);
};

var put= function( url, data, connection, cacheSelector, callback ) {
    return _request('PUT', url, { data: data || null, connection: connection }, cacheSelector, callback);
};

var del= function( url, data, connection, cacheSelector, callback ) {
    return _request('DELETE', url, { data: data || null, connection: connection }, cacheSelector, callback);
};

var methods= {};

['Model', 'ModelTemplate'].forEach(function( type ) {
    methods['save' + type]= function( model ) {
        var cacheSelector= buildCacheSelector(this);
        return put(type + '/save', model, this.connection, cacheSelector, function( err, result ) {
            if ( err ) return;

            var id= model._id;
            if ( !id ) return;

            var key= SpongeTools.buildCacheKey(SpongeTools.getCachedMethodData('get' + type, [id]));

            return updateCache(key, cacheSelector, model);
        });
    };
});

methods.setJobTitle= function( data ) {
    var self= this;
    var cacheSelector= buildCacheSelector(this);
    return put('Job/setTitle/' + data.jobId, { title: data.title }, this.connection, cacheSelector, function( err, result ) {
        if ( err ) return;

        methods.getJob.call(self, data.jobId);
    });
};

methods.setJobDescription= function( data ) {
    var self= this;
    var cacheSelector= buildCacheSelector(this);
    return put('Job/setDescription/' + data.jobId, { description: data.description }, this.connection, cacheSelector, function( err, result ) {
        if ( err ) return;

        methods.getJob.call(self, data.jobId);
    });
};


methods.clearCache= function( global ) {
    var query= {};
    if ( !global || !SpongeTools.isAdmin() ) query.userId= this.userId;

    dataCacheMeta.remove(query);
    dataCache.remove(query);
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

        var userId= urlData.noAuth ? anyUserId : Meteor.userId();

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
            Meteor.setTimeout(function() {
                delete getInstances[instanceKey];
            }, 1000);

            if ( !urlData.lastInstance || key === lastInstance.key ) return;

            return methods[name].apply(methodSelf, lastInstance.args);
        };

        var cacheSelector= buildCacheSelector(this, urlData.noAuth);
        return fn(urlData.url, urlData.data, this.connection, cacheSelector, function( err, result ) {
            if ( err ) {
                return updateCacheError(key, cacheSelector, err, function( err ) {
                    return finishFn();
                });
            }

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

console.log('updateCache', key, cacheSelector)
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

var touchCache= function( key, query, cb ) {
    if ( !cb ) cb= function() {};

    query.key= key;

    return dataCacheMeta.upsert(query, _.extend({ timeStamp: new Date(), }, query), cb);
};

var updateCache= function( key, query, newData, cb ) {
    if ( !cb ) cb= function() {};

    if ( newData === undefined ) newData= null;

    query.key= key;

    return touchCache(key, query, function( err ) {
        if ( err ) console.error(1, query, err);

        // update data only if changed
        var oldData= dataCache.findOne(query);
        if ( oldData && _.isEqual(oldData.data, newData) ) return cb();

        return dataCache.upsert(query, _.extend({ data: newData, }, query), function( err ) {
            if ( err ) console.error(2, query, newData, err);
            cb.apply(this, arguments);
        });
    });
};

var updateCacheError= function( key, query, err, cb ) {
    var data= {
        date: new Date(),
        error: {},
    };
    if ( typeof err === 'object' && err && err.response ) {
        if ( err.response.data ) data.error= err.response.data;
        if ( err.response.statusCode ) data.error.statusCode= err.response.statusCode;
        data.error.key= key;
    }
    else {
        data.error= err;
    }

    return updateCache(SpongeTools.ErrorCacheKey, query, SpongeTools.convertToMongo(data), function( err ) {
        if ( !cb ) return;

        if ( err ) return cb(err);

        return cb();
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

onAfterMethod.deleteResult= function( jobId, resultId ) {
    removeFromCache('getJobResult', jobId);
};

onAfterMethod.saveUser= function( userData, oldUserName, result ) {

    // user name has been changed (or added), refresh user names' list
    if ( userData.name ) removeFromCache('getAllUserNames');

    // refresh current user
    if ( oldUserName ) removeFromCache('getUserData', oldUserName)
};

onAfterMethod.removeUser= function( userId, result ) {

    removeFromCache('getAllUserNames');
};

// fill 'getJob'-Cache with data from getJobs
onAfterMethod.getJobs= function( /* arguments */ ) {
    var args= Array.prototype.slice.apply(arguments);
    var data= args.pop();

    data.forEach(function( job ) {
        var jobId= job.jobId;
        if ( !jobId ) return;

        var urlData= SpongeTools.getCachedMethodData('getJob', [ jobId ]);
        var key= SpongeTools.buildCacheKey(urlData);
        var cacheSelector= buildCacheSelector(this, urlData.noAuth);

        updateCache(key, cacheSelector, SpongeTools.convertToMongo(job), () => {});
    }.bind(this));
    return data;
};

