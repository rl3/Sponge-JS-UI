
Meteor.subscribe('client-cache');

var dataCache= new Meteor.Collection('Cache');
var dataCacheMeta= new Meteor.Collection('CacheMeta');
var sessionData= new Meteor.Collection('SessionData')

var TIMEOUT_DEFAULT= 1e6; //1000s

var getCachedData= function( name, timeout ) {
    if ( arguments.length < 2 ) timeout= TIMEOUT_DEFAULT;

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

        // return old data (if present), because we don't get informed, when only metaData is updated but data stays the same
        // function will be called again on data change
        return data ? data.data : undefined;
    };
};

var getError= function() {
    var data= SpongeTools.convertFromMongo(dataCache.findOne({ key: SpongeTools.ErrorCacheKey }));
    return data ? data.data : undefined;
};

var postData= function( id, timeout ) {
    if ( arguments.length < 2 ) timeout= TIMEOUT_DEFAULT;

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
    return SpongeTools.cleanUrl(sd.baseUrl + url) + append + 'SessionId=' + sd.token;
};

var getUsername= function() {
    var sd= sessionData.findOne();

    if ( sd ) return sd.username;
};

var getUser= function( connection ) {
    var sd= sessionData.findOne();
    return sd && { username: sd.username, roles: sd.roles, template: sd.template };
};

SpongeTools.getCachedData= getCachedData;
SpongeTools.postData= postData;
SpongeTools.getError= getError;
SpongeTools.getUsername= getUsername;
SpongeTools.getUser= getUser;
SpongeTools.TIMEOUT_SHORT= 20e3; // 20s
SpongeTools.TIMEOUT_MEDIUM= 100e3; // 100s
SpongeTools.TIMEOUT_DEFAULT= TIMEOUT_DEFAULT; // 1000s

SpongeTools.buildApiUrl= buildApiUrl;
