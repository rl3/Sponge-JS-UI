
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

var dataObjectToString= function( value ) {
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

var arrayToString= function( value ) {
    if ( !value.length ) return '<empty Array>';

    var keys;
    var table= true;
    for ( var i in value ) {
        var v= value[i];
        if ( typeof v !== 'object' ) {
            table= false;
            break;
        };
        var _keys= Object.keys(v);
        if ( !+i ) {
            keys= _keys;
            continue;
        }
        if ( !_.difference(keys, _keys).length ) continue;

        table= false;
        break;
    }
    if ( table ) {
        return '<table class="value table">'
            + '<tr><th>i</th>' + keys.map(function( k ) { return '<th>' + k + '</th>'; }).join('') + '</tr>'
            + value.map(function( o, i ) {
                return '<tr><td>' + i + '</td>' + keys.map(function( k ) { return '<td>' + valueToString(o[k]) + '</td>' }).join('') + '</tr>';
            }).join('')
            + '</table>'
            ;
    }

    return '<table class="value array">'
        + value.map(function( v, i ) { return '<tr><td class="value arrayIndex">' + i + '</td><td class="value arrayValue">' + valueToString(v) + '</td></tr>'; }).join('')
        + '</table>';
};

var objectToString= function( value ) {
    var keys= Object.keys(value);
    if ( !keys.length ) return '<empty Object>';

    return '<table class="value object">'
        + keys.map(function( key ) { return '<tr><td class="value objectKey">' + key + '</td><td class="value objectValue">' + valueToString(value[key]) + '</td></tr>'; }).join('')
        + '</table>';
};

var valueToString= function( value, options ) {
    if ( value === undefined || value === null ) return '<empty>';

    if ( typeof value === 'object' ) {
        if ( value instanceof Date )    return dateToString(value);
        if ( value instanceof Meteor.Collection.ObjectID )
                                        return 'ObjectId("' + value + '")';
        if ( _.isArray(value) ) {
            if ( value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' ) return locationToString(value);

            return options && 'returnOnArray' in options ? options.returnOnArray : arrayToString(value);
        }
        if ( '$array' in value )        return arrayToString(value);
        if ( '$range' in value )        return rangeToString(value);
        if ( String(value.type).toLowerCase() === 'map' )
                                        return mapToString(value);
        if ( String(value.type).toLowerCase() === 'nearest' )
                                        return nearestToString(value);
        if ( '$ref' in value )          return dataObjectToString(value);

        if ( value.constructor === Object ) {
            return options && 'returnOnObject' in options ? options.returnOnObject : objectToString(value);
        }
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
