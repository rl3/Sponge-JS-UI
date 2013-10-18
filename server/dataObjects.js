Meteor.startup(function() {
    Future = Npm.require('fibers/future');
});

var Debug= false;

var baseUrl= CONFIG.baseurl;
var auth= CONFIG.auth;

var async= function( fn ) {
    var future= new Future();
    fn(function( err, result ) {
        future.ret(result);
    });
    return future.wait();
};

var _request= function( method, url, options, callback ) {
    if ( auth ) options.auth= auth;

    options= EJSON.toJSONValue(options);

    var _cb= callback;
    callback= function( err, result ) {
        console.log(method + ' result', url, JSON.stringify(options));
        result= EJSON.fromJSONValue(result || {});
        if ( Debug ) {
//            console.log('headers', d.headers);
            console.log('data', url, result.data);
        }
        if ( _cb ) return _cb.call(this, err, result);
    }

    if ( callback ) {
        return Meteor.http.call(method, baseUrl + url, options, callback);
    }
    return Meteor.http.call(method, baseUrl + url, options);
}

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
    methods[name]= function( options ) {
        var _urlData= DataObjectTools.cachedMethodUrl[name](options);

        // run onBeforeMethod with options and return on false
        if ( name in onBeforeMethod && !onBeforeMethod[name](options) ) return;

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
            if ( name in onAfterMethod) data= onAfterMethod[name](options, data);

            updateCache(key, DataObjectTools.convertToMongo(data), function( err ) {
                delete getInstances[key];
            });
        });
    };
});

methods.getJobLog= function( jobId ) {
    return async(function( cb ) {
        return Meteor.http.get(baseUrl + 'Job/log/' + jobId, cb);
    });
};

methods.deleteJobLog= function( jobId ) {
    return async(function( cb ) {
        return Meteor.http.del(baseUrl + 'Job/log/' + jobId, cb);
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


