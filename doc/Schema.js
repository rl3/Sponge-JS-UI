var Schema=
{
//    "_id" : ObjectId("5196435b176bf897f66ffafd"),
    'type': 'Schema',
    "objectType" : "cropSequence",
    "version" : 1,
    "description" : "crop sequence",
    "rgbcolor" : [
        102,
        204,
        51
    ],
    "iteratorType" : [
        {
            "name" : "date",
            "type" : 'Date',
        },
    ],
    "iteratorCondition" : function (value, lib) {
        return {
            "start": {$lte: value},
            "end": {$gte: value},
        };
    },
//??
    "iteratorCompare" : function (v1, v2, lib) {
        return  v1.date.getTime() - v2.date.getTime();
    },
    "values" : [
        {
            name: 'name',
            type: 'String',
        },
        {
            name: 'humidity',
            type: 'Double',
            description: 'water content',
            unit: '%'
        },
        {
            name: 'gainFM',
            type: 'Double',
            description: 'gain mass',
            "unit" : "kg/m²",
        },
        {
            name: 'gainTM',
            type: 'Double',
            description: 'gain mass dry matter',
            "unit" : "kg/m²",
        },
        {
            name: 'plant',
            type: {
// wie resultDefinition in Model
                typeSignature: 'plant::v1',
// alternativ
                args: {},
                result: {},
            },
            "description" : "plant object",
            "unit" : "ref",
        },
    ]
}
