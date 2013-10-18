var getCachedData= function(name, timeout) {
    if ( arguments.length < 2 ) timeout= 1000000;
    return function( options ) {
        var now= new Date();
        var than= new Date(now - timeout);
        var id= DataObjectTools.cachedMethodUrl[name](options);

        var key= typeof id === 'object' ? JSON.stringify(id) : id;

        var query= { _id: key, };

        var metaData= DataObjectTools.dataCacheMeta.findOne(query, { reactive: false }) || {};
        var data= DataObjectTools.convertFromMongo(DataObjectTools.dataCache.findOne(query));

        // if cache data is valid, return current data
        if ( metaData.timeStamp > than && data ) return data.data;

        Meteor.apply(name, Array.prototype.slice.call(arguments));

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

DataObjectTools.getCachedData= getCachedData;
DataObjectTools.postData= postData;
