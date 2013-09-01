
var arrayToString= function( value ) {
    return '[ ' + value.$array.map(valueToString).join(', ') + ' ]';
};

var rangeToString= function( value ) {
    return 'From: ' + valueToString(value.$range.from)
        + ' To: '   + valueToString(value.$range.to)
        + ' Step: ' + valueToString(value.$range.step);
};

var pad= function( value ) {
    return +value < 10 ? "0" + value : String(value);
};
var dateToString= function( value ) {
    return pad(value.getDate()) + '.' + pad(value.getMonth() + 1) + '.' + value.getFullYear();
};

var locationToString= function( value ) {
    return 'lat(' + value[1] + ')/lon(' + value[0] + ')';
};

var getObject= {
    'Model': DataObjectTools.getCachedData('getModel'),
    'AgroObj': DataObjectTools.getCachedData('getAgroObject'),
};

var objectToString= function( value ) {
    var collection= value.$ref;
    var id= (value.selector || {})._id;

    var name= '';
    if ( collection in getObject && id ) {
        var object= getObject[collection](new Meteor.Collection.ObjectID(id));
        if ( object ) name= object.name;
    }
    return collection + ' ' + name;
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
        if ( value instanceof Date )    return dateToString(value);
        if ( _.isArray(value) && value.length === 2 )
                                        return locationToString(value);
        if ( '$array' in value )        return arrayToString(value);
        if ( '$range' in value )        return rangeToString(value);
        if ( value.type === 'map' )     return mapToString(value);
        if ( value.type === 'nearest' ) return nearestToString(value);
        if ( '$ref' in value )          return objectToString(value);
    }

    if ( value === '' ) return '<empty string>'

    return String(value);
};

DataObjectTools.valueToString= valueToString;