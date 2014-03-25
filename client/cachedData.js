
Meteor.subscribe('client-cache');

var dataCache= new Meteor.Collection('Cache');
var dataCacheMeta= new Meteor.Collection('CacheMeta');
var sessionData= new Meteor.Collection('SessionData')

var getCachedData= function( name, timeout ) {
    if ( arguments.length < 2 ) timeout= 1000000;

    return function( /* aguments */ ) {
        var now= new Date();
        var than= new Date(now - timeout);

        var args= Array.prototype.slice.call(arguments);
        var cb;

        if ( args.length && typeof args[args.length - 1] === 'function' ) {
            cb= args.pop();
        }

        var key= SpongeTools.buildCacheKey(SpongeTools.getCachedMethodData(name, args));

        var query= { key: key, };

        var metaData= dataCacheMeta.findOne(query, { reactive: false }) || {};
        var data= SpongeTools.convertFromMongo(dataCache.findOne(query));

        // if cache data is valid, return current data
        if ( metaData.timeStamp > than && data ) return data.data;

        if ( cb ) {
            Meteor.apply(name, args, cb);
        }
        else {
            Meteor.apply(name, args);
        }

        // return old data (if present), because we don't get informed, when only metaData is updated
        // function will be called again on data change
        return data ? data.data : undefined;
    };
};

var postData= function( id, timeout ) {
    if ( arguments.length < 2 ) timeout= 1000000;

    return function( data, options ) {
        var args= Array.prototype.slice.call(arguments);
        if ( typeof args[args.length - 1] === 'function' ) {
            var cb= args.pop();
            return Meteor.apply(id, args, cb);
        }
        Meteor.apply(id, args);
    };
};

var buildApiUrl= function( url ) {
    var sd= sessionData.findOne();
    if ( !sd ) return '#';

    var append= url.match(/\?/) ? '&' : '?';
    return sd.baseUrl + url + append + 'SessionId=' + sd.token;
};

SpongeTools.getCachedData= getCachedData;
SpongeTools.postData= postData;

SpongeTools.buildApiUrl= buildApiUrl;
