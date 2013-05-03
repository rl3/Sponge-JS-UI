
dataCache= new Meteor.Collection("Cache");

if (Meteor.isClient) {
    getCachedData= function(id, timeout) {
//        Meteor.subscribe(id);
        return function() {
            var now= new Date();
            var data= dataCache.find({id: id, timeStamp: { $gt: now - timeout, }, });
            console.log(data)
            if ( data ) {
//                return data.data;
            }

            Meteor.apply(id);
        };
    };
};
