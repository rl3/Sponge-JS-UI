
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

var injectVar= function( context, name, initValue ) {
    if ( !context._meta ) context._meta= {};
    if ( !context._meta[name] ) context._meta[name]= ReactiveValue(initValue)

    return context._meta[name];
};

DataObjectTools= {
    getType: getType,
    formatValue: formatValue,
    formatNumber: formatNumber,
    formatIteratorValues: formatIteratorValues,
    injectVar: injectVar,
};
