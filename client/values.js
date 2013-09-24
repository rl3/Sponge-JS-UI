
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
    return pad(value.getUTCDate()) + '.' + pad(value.getUTCMonth() + 1) + '.' + value.getUTCFullYear();
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
        var object= getObject[collection](id);
        if ( object ) name= object.name;
    }
    return collection + ' ' + name;
};

var mapToString= function( value ) {
console.log('Map', value);
    return 'MAP: ' + value;
};

var nearestToString= function( value ) {
    var result= 'Nearest ';
    var sel= value.selector;
    if ( sel ) {
        result+= sel.objectType + '/' + sel.version;
        var args= [];
        for ( var prop in sel ) {
            if ( prop === 'objectType' || prop === 'version' ) continue;

            args.push(prop + '="' + sel[prop] + '"');
        }
        if ( args.length ) {
            result+= ' (' + args.join(', ') + ')';
        }
    }
    return result;
};


var valueToString= function( value ) {
    if ( value === undefined ) return '<empty>';

    if ( typeof value === 'object' ) {
        if ( value instanceof Date )    return dateToString(value);
        if ( _.isArray(value) && value.length === 2 )
                                        return locationToString(value);
        if ( '$array' in value )        return arrayToString(value);
        if ( '$range' in value )        return rangeToString(value);
        if ( String(value.type).toLowerCase() === 'map' )
                                        return mapToString(value);
        if ( String(value.type).toLowerCase() === 'nearest' )
                                        return nearestToString(value);
        if ( '$ref' in value )          return objectToString(value);
    }

    if ( value === '' ) return '<empty string>'

    return String(value);
};

var buildValue= function( name, type, valueFn, info ) {
    var result= {
        name: name,
        type: type,
        valueText: function() {
            return DataObjectTools.valueToString(valueFn());
        },
        getValue: function() { return valueFn(); },
        setValue: function( newValue ) { valueFn(newValue); }
    };
    if ( info ) result.info= info;

    return result;
};

var buildValues= function( args, property, valueContext ) {
    var injectPrefix= 'args.' + property + '.';
    return Object.keys(args[property]).map(function( name ) {
        return buildValue(
            name,
            args[property][name], // type
            DataObjectTools.injectVar(valueContext, injectPrefix + name, undefined),
            args.info && args.info[property] && args.info[property][name] // info
        );
    });
};


DataObjectTools.valueToString= valueToString;
DataObjectTools.buildValues= buildValues;
DataObjectTools.buildValue= buildValue;
