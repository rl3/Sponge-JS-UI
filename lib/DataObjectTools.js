

var getType= function( data ) {
    switch ( typeof data ) {
    case 'number': return 'Double';
    case 'string': return 'String';
    case 'object':
        if ( data instanceof Date ) return 'Date';
    }
    return 'Unknown';
}

var formatNumber= function( value, digits, leadingChar ) {
    if ( !leadingChar ) leadingChar= '0';
    value= +value;
    valueString= String(value);
    while ( valueString.length < digits ) valueString= leadingChar + valueString;
    return valueString;
};

var formatValue= function( data, extended ) {
    switch ( getType(data) ) {
    case 'Date': 
        return formatNumber(data.getUTCDate(), 2) + '.'
            + formatNumber(data.getUTCMonth() + 1, 2) + '.' 
            + formatNumber(data.getUTCFullYear(), 4) +
            (extended ? ' ' + formatNumber(data.getUTCHours(), 2) + ':'
                + formatNumber(data.getUTCMinutes(), 2) + ':'
                + formatNumber(data.getUTCSeconds(), 2) + '.'
                + formatNumber(data.getUTCMilliseconds()) : ''
            );
    default: return data;
    }
};

var clone= function( value ) {
    if ( !value || typeof value !== 'object' ) return value;

    return EJSON.fromJSONValue(JSON.parse(JSON.stringify(EJSON.toJSONValue(value))));
};

var formatIteratorValues= function( values, schema ) {
    if ( !values || !schema ) return;

    var definition= schema.definition || {};
    var args= definition.args || {};
    var info= (definition.info || {}).args || {};

    var result= Object.keys(args).map(function( arg, i ) {
        var result= {
            name: arg,
            value: formatValue((values || {})[arg]),
            index: i,
        };
        if ( info[arg] ) {
            if ( 'unit' in info[arg] ) result.unit= info[arg].unit;
        }
        return result;
    });

    return result;
};

var getAllSchemas;

var valueIsSatisfiedBy= function( o1, o2 ) {
    for ( var name in o1 ) {
        if ( !(name in o2) ) return false;
        var v1= o1[name];
        var v2= o2[name];

        if ( typeof v1 !== typeof v2 ) return false;

        if ( typeof v1 !== 'object' && v1 !== v2 ) return false;

        if ( !valueIsSatisfiedBy( v1, v2 ) ) return false;
    }
}

var findMatchingSchema= function( args, result ) {
    if ( ! getAllSchemas ) {
        getAllSchemas= DataObjectTools.getCachedData('getAllSchemas');
    }

    var schemas= getAllSchemas();
    for ( var i in schemas ) {
        var schema= schemas[i];
        var schemaArgs= schema.definition.args;
        var schemaResult= schema.definition.result;
        return valueIsSatisfiedBy( schemaArgs, args ) && valueIsSatisfiedBy( result, schemaResult );
    }
    return;
}

var findThisSchema= function( args, result ) {
    if ( ! getAllSchemas ) {
        getAllSchemas= DataObjectTools.getCachedData('getAllSchemas');
    }

    var schemas= getAllSchemas();
    for ( var i in schemas ) {
        var schema= schemas[i];
        var schemaArgs= schema.definition.args;
        var schemaResult= schema.definition.result;

        if ( _.isEqual( schemaArgs, args ) && _.isEqual( result, schemaResult ) ) return schema
    }
    return;
}

var modelId= function( id ) {
    var sessionName= 'modelId';
    if ( !arguments.length ) {
        return Session.get(sessionName);
    }
    return Session.set(sessionName, id);
};

var jobId= function( id ) {
    var sessionName= 'jobId';
    if ( !arguments.length ) {
        return Session.get(sessionName);
    }
    return Session.set(sessionName, id);
};

_.extend(DataObjectTools, {
    getType: getType,
    formatValue: formatValue,
    formatNumber: formatNumber,
    formatIteratorValues: formatIteratorValues,
    findMatchingSchema: findMatchingSchema,
    findThisSchema: findThisSchema,
    modelId: modelId,
    jobId: jobId,
    clone: clone,
});
