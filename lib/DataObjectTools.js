
var getType= function( data ) {
    if ( !data || !data.className ) {
        switch ( typeof data ) {
        case 'number': return 'Double';
        case 'string': return 'String';
        case 'object':
            if ( '__date' in data ) return 'Date';
        }
        return 'Unknown';
    }
    var parts= data.className.split('.');
    var type= parts.pop();
    return type.replace(/^ParameterValue/, '');
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
        var date= new Date(data.__date || data.value.__date);
        return formatNumber(date.getUTCDate(), 2) + '.'
            + formatNumber(date.getUTCMonth() + 1, 2) + '.' 
            + formatNumber(date.getUTCFullYear(), 4) +
            (extended ? ' ' + formatNumber(date.getUTCHours(), 2) + ':'
                + formatNumber(date.getUTCMinutes(), 2) + ':'
                + formatNumber(date.getUTCSeconds(), 2) + '.'
                + formatNumber(date.getUTCMilliseconds()) : ''
            );
    default: return data.value;
    }
};

var formatIteratorValues= function( values, iteratorTypes ) {
    if ( !values || !iteratorTypes ) return;

    if ( 'className' in values ) {
        var _values= {};
        _values[iteratorTypes[0].argName]= values;
        values= _values;
    }

    return iteratorTypes.map(function( it, i ) {
        return {
            index: i,
            name: it.argName,
            unit: it.type.unit,
            value: formatValue(values[it.argName]),
        }
    });
};

DataObjectTools= {
    getType: getType,
    formatValue: formatValue,
    formatNumber: formatNumber,
    formatIteratorValues: formatIteratorValues,
};
