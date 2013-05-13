
var getType= function( data ) {
    if ( !data || !data.className ) {
        switch ( typeof data ) {
        case 'number': return 'Double';
        case 'string': return 'String';
        case 'object':
            if ( data.__date instanceof Date ) return 'Date';
        }
        return 'Unknown';
    }
    var parts= data.className.split('.');
    var type= parts.pop();
    return type.replace(/^ParameterValue/, '');
}

var formatValue= function( data ) {
    switch ( getType(data) ) {
    case 'Date': 
        var date= new Date(data.value.__date);
        return date.getUTCDate() + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear();
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
    formatIteratorValues: formatIteratorValues,
};
