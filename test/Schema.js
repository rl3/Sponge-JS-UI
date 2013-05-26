var zuppi= function() {
return {
    type: 'Schema',
    objectType : 'soil',
    version : 1,
    description : 'Soils',
    iteratorType : {
        z: {
            type: 'Double',
            description: 'Depth',
            unit: 'm',
        },
    },
    iteratorCondition : function (value, lib) {
        return {
            'start.z': {$lte: value.z},
            'end.z': {$gte: value.z},
        };
    },
    iteratorCompare : function (v1, v2, lib) {
        return  v1.z - v2.z;
    },
    values : [
        {
            name: 'name',
            type: 'String',
        },
        {
            name: 'Qfc',
            type: 'Double',
            description: 'Feldkapazitaet m³(Wasser)/m³(Boden)',
        },
        {
            name: 'Qwp',
            type: 'Double',
            description: 'Welkepunkt m³(Wasser)/m³(Boden)',
        },
        {
            name: 'AWC',
            type: 'Double',
            description: 'verfügbare Wassermenge je Meter Wurzeltiefe',
            unit : "mm/m",
        },
    ]
}
}