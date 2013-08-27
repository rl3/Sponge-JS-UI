
var arrayToString= function( value ) {
    return '[ ' + value.$array.map(valueToString).join(', ') + ' ]';
};

var rangeToString= function( value ) {
    return 'From: ' + valueToString(value.$range.from)
        + ' To: '   + valueToString(value.$range.to)
        + ' Step: ' + valueToString(value.$range.step);
};

var mapToString= function( value ) {
    return 'MAP: ' + value;
};

var nearestToString= function( value ) {
    return 'NEAREST: ' + value;
};


var valueToString= function( value ) {
    if ( value === undefined ) return '<empty>';

    if ( typeof value === 'object' ) {
        if ( '$array' in value )        return arrayToString(value);
        if ( '$range' in value )        return rangeToString(value);
        if ( value.type === 'map' )     return mapToString(value);
        if ( value.type === 'nearest' ) return nearestToString(value);
    }

    if ( value === '' ) return '<empty string>'

    return String(value);
};

DataObjectTools.valueToString= valueToString;