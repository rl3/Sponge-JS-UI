var ModelTemplate=
{
//    "_id" : new ObjectID(),
    "name" : "modified_soil_1",
    'type': 'ModelTemplate',
//??    "version" : 1,
    "resultDefinition" : {
        "typeSignature" : "soil::v1",
    },
    "resultDefinition" : {
        args: {
            z: 'Double',
        },
        result: {
            name: 'String',
            Qwc: 'Double',
            Qwk: 'Double',
        },
    },
    "inputDefinitions" : {
        "soil" : {
            // wie resultDefinition
        },
    },
    "timeStamp" : new Date("2013-05-17T16:44:04.040Z"),
    "functionBodies" : {
        "name" : function (args, lib, callback) {
            lib.callInputFunction("soil", "name", args, function(err, value) {
                // modify value here...
                callback(err, value);
            });
        },
        "Qfc" : function (args, lib, callback) {
            lib.callInputFunction("soil", "Qfc", args, function(err, value) {
                // modify value here...
                callback(err, value);
            });
        },
        "Qwp" : function (args, lib, callback) {
            lib.callInputFunction("soil", "Qwp", args, function(err, value) {
                // modify value here...
                callback(err, value);
            });
        },
        "AWC" : function (args, lib, callback) {
            lib.callInputFunction("soil", "AWC", args, function(err, value) {
                // modify value here...
                callback(err, value);
            });
        },
    },
}
