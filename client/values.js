
var arrayToString= function( value, options ) {
    return '[ ' + value.$array.map(function(v) { return valueToString(v, options); } ).join(', ') + ' ]';
};

var rangeToString= function( value, options ) {
    return 'From: ' + valueToString(value.$range.from, options)
        + ' To: '   + valueToString(value.$range.to, options)
        + ' Step: ' + valueToString(value.$range.step, options);
};

var pad= function( value ) {
    return +value < 10 ? "0" + value : String(value);
};
var dateToString= function( value, options ) {
    return pad(value.getUTCDate()) + '.' + pad(value.getUTCMonth() + 1) + '.' + value.getUTCFullYear();
};
var timeToString= function( value, options ) {
    return pad(value.getHours()) + ':' + pad(value.getMinutes()) + ':' + pad(value.getSeconds());
};

var locationToString= function( value, options ) {
    var result= 'lat(' + value[1] + ')/lon(' + value[0] + ')';

    if ( options && 'locationFn' in options ) {
        var locationFn= typeof options.locationFn === 'function' ? options.locationFn : defaultLocationFn;
        return locationFn(result, value);
    }

    return result;
};

var getObject= {
    'Model': DataObjectTools.getCachedData('getModel'),
    'AgroObj': DataObjectTools.getCachedData('getAgroObject'),
};

var dataObjectToString= function( value, options ) {
    var collection= value.$ref;
    var id= (value.selector || {})._id;

    var name= '';
    if ( collection in getObject && id ) {
        var object= getObject[collection](id);
        if ( object ) name= object.name;
    }
    return collection + ' ' + name;
};

var mapToString= function( value, options ) {
console.log('Map', value);
    return 'MAP: ' + value;
};

var nearestToString= function( value, options ) {
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

var arrayToString= function( value, options ) {
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
                return '<tr><td>' + i + '</td>' + keys.map(function( k ) { return '<td>' + valueToString(o[k], options) + '</td>' }).join('') + '</tr>';
            }).join('')
            + '</table>'
            ;
    }

    return '<table class="value array">'
        + value.map(function( v, i ) { return '<tr><td class="value arrayIndex">' + i + '</td><td class="value arrayValue">' + valueToString(v, options) + '</td></tr>'; }).join('')
        + '</table>';
};

var objectToString= function( value, options ) {
    var keys= Object.keys(value);
    if ( !keys.length ) return '<empty Object>';

    return '<table class="value object">'
        + keys.map(function( key ) { return '<tr><td class="value objectKey">' + key + '</td><td class="value objectValue">' + valueToString(value[key], options) + '</td></tr>'; }).join('')
        + '</table>';
};

var valueToString= function( value, options ) {
    if ( value === undefined || value === null ) return '<empty>';

    if ( typeof value === 'object' ) {
        if ( value instanceof Date )    return dateToString(value, options);
        if ( value instanceof Meteor.Collection.ObjectID )
                                        return 'ObjectId("' + value + '")';
        if ( _.isArray(value) ) {
            if ( value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' ) return locationToString(value, options);

            return options && 'returnOnArray' in options ? options.returnOnArray : arrayToString(value, options);
        }
        if ( '$array' in value )        return arrayToString(value, options);
        if ( '$range' in value )        return rangeToString(value, options);
        if ( String(value.type).toLowerCase() === 'map' )
                                        return mapToString(value, options);
        if ( String(value.type).toLowerCase() === 'nearest' )
                                        return nearestToString(value, options);
        if ( '$ref' in value )          return dataObjectToString(value, options);

        if ( value.constructor === Object ) {
            return options && 'returnOnObject' in options ? options.returnOnObject : objectToString(value, options);
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
    var info= args.info && args.info[property] || {};

    var injectPrefix= 'args.' + property + '.';
    return Object.keys(args[property]).map(function( name ) {
        return buildValue(
            name,
            args[property][name], // type
            DataObjectTools.injectVar(valueContext, injectPrefix + name, (info[name] || {}).default),
            info[name] // info
        );
    });
};

var defaultLocationFn= function( text, location ) {
    return '<a href="#" class="location" lon="' + location[0] + '" lat="' + location[1] + '">' + text + '</a>';

    return '<a target="googlemaps" href="https://www.google.de/maps?q=' + location[1] + ',' + location[0] + '">' + text + '</a>';
};

DataObjectTools.valueToString= valueToString;
DataObjectTools.buildValues= buildValues;
DataObjectTools.buildValue= buildValue;

DataObjectTools.dateToString= dateToString;
DataObjectTools.timeToString= timeToString;

DataObjectTools.defaultLocationFn= defaultLocationFn;
