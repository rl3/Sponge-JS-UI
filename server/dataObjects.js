
Meteor.startup(function() {
    dataCache.remove({}, function() {
        dataCache.insert({ id: 'dataObjects', });
    });
});

Meteor.publish('dataObjects', function() {
    return dataCache.find({ id: 'dataObjects' });
});

Meteor.methods({
    'dataObjects': function() {

console.log("SERVER: started dataObjects");

        var result= [
            {
                id: "plant1",
                version: 1,
            },
            {
                id: "plant2",
                version: 1,
            },
            {
                id: "plant3",
                version: 2,
            },
            {
                id: "plant4",
                version: 2,
            },
        ];

        dataCache.update({ id: 'dataObjects' }, { '$set': { timeStamp: new Date(), data: result, }, }, function(err) {
console.log("finished dataObjects");
console.log(dataCache.findOne({id: 'dataObjects'}))


            if (!err) return;
            console.log(err);
            console.trace();
        });
    },
});
