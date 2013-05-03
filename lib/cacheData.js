
dataCache= new Meteor.Collection("Cache");

if (Meteor.isClient) {
    getCachedData= function(id, timeout) {
        return function() {
            var now= new Date();
            var than= new Date(now - timeout);
            var data= dataCache.findOne({id: id, timeStamp: { $gt: than }, });
            if ( data ) {
                return data.data;
            }
            Meteor.apply(id);
        };
    };
};
