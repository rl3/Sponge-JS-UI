var running= {};

var getCachedData= function(name, timeout) {
    if ( arguments.length < 2 ) timeout= 1000000;
    return function( options ) {
        var now= new Date();
        var than= new Date(now - timeout);
        var id= DataObjectTools.cachedMethodUrl[name](options);

        var query= { _id: id, timeStamp: { $gt: than }, };

        var data= DataObjectTools.dataCache.findOne(query);
        if ( data ) {
            delete running[id];
            return data.data;
        }

        if ( id in running ) return;

        running[id]= undefined;
        Meteor.apply(name, Array.prototype.slice.call(arguments));
    };
};

var postData= function( id, timeout ) {
    if ( arguments.length < 2 ) timeout= 1000000;
    return function( data, options ) {
        Meteor.apply(id, Array.prototype.slice.call(arguments));
    };
};

DataObjectTools.getCachedData= getCachedData;
DataObjectTools.postData= postData;
