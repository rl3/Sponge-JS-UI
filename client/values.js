
var $arrayToString= function( value, options ) {
    options= _.extend({ quoteStrings: true }, options);
    return '[ ' + value.$array.map(function(v) { return valueToString(v, options); } ).join(', ') + ' ]';
};

var $rangeToString= function( value, options ) {
    options= _.extend({ quoteStrings: true }, options);
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

    if ( options && 'onLocation' in options ) {
        var onLocationFn= typeof options.onLocation === 'function' ? options.onLocation : defaultLocationFn;
        return onLocationFn(result, value);
    }

    return result;
};

var getObject= {
    'Model': SpongeTools.getCachedData('getModel'),
    'AgroObj': SpongeTools.getCachedData('getAgroObject'),
};

var dataObjectToString= function( value, options ) {
    var collection= value.$ref;
    var id= (value.selector || {})._id;

    var name;
    if ( collection in getObject && id ) {
        var object= getObject[collection](id);
        if ( object ) name= object.name;
    }
    if ( !name ) name= valueToString(id);

    if ( collection === 'AgroObj' ) return name;

    return collection + ' ' + name;
};

var selectorToString= function( sel, nameProperty ) {
    if ( !sel ) return '<empty>';

    sel= _.clone(sel);

    var result= [];

    if ( nameProperty && nameProperty in sel ) {
        result.push(valueToString(sel[nameProperty], { quoteStrings: true }));
        delete sel[nameProperty];
    }

    if ( 'objectType' in sel && 'version' in sel ) {
        var version= sel.version;
        if ( typeof version === 'object' && '$in' in version ) {
            version= '[' + version.$in.join(',') + ']';
        }
        result.push(sel.objectType + '/' + version);
        delete sel.objectType;
        delete sel.version;
    }

    var args= Object.keys(sel).map(function( prop ) {
        var value= sel[prop];
        if ( value && typeof value === 'object' && '$in' in value ) {
            value= { $array: value.$in };
        }

        return prop + '=' + valueToString(value, { quoteStrings: true });
    });
    if ( args.length ) {
        result.push('(' + args.join(', ') + ')');
    }
    return result.join(' ');
};

var mapToString= function( value, options ) {
    return 'Map ' + selectorToString(value.selector, 'mapname');
};

var nearestToString= function( value, options ) {
    return 'Nearest ' + selectorToString(value.selector, 'tags');
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
        + keys.map(function( key ) { return '<tr valign="top"><td class="value objectKey">' + key + '</td><td class="value objectValue">' + valueToString(value[key], options) + '</td></tr>'; }).join('')
        + '</table>';
};

var applyOn= function( value, options, onName, fn ) {
    if ( !options || !(onName in options) ) return fn(value, options);

    var onValue= options[onName];
    if ( typeof onValue === 'function' ) onValue= onValue( value, options );

    return onValue === false ? onValue : fn(onValue, options);
};

var valueToString= function( value, options ) {
    if ( value === undefined || value === null ) return '<empty>';

    if ( typeof value === 'object' ) {
        if ( value instanceof Date )    return dateToString(value, options);
        if ( value instanceof Meteor.Collection.ObjectID )
                                        return 'ObjectId("' + value + '")';
        if ( _.isArray(value) ) {
            if ( value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' ) return locationToString(value, options);

            return applyOn(value, options, 'onArray', arrayToString);
        }
        if ( '$array' in value )        return $arrayToString(value, options);
        if ( '$range' in value )        return $rangeToString(value, options);
        if ( String(value.type).toLowerCase() === 'map' )
                                        return mapToString(value, options);
        if ( String(value.type).toLowerCase() === 'nearest' )
                                        return nearestToString(value, options);
        if ( '$ref' in value )          return dataObjectToString(value, options);
        if ( '_id' in value && 'type' in value ) {
                                        return dataObjectToString({ $ref: value.type, selector: { _id: value._id, }, }, options);
        }

        if ( value.constructor === Object ) {
            return applyOn(value, options, 'onObject', objectToString);
        }
    }
    if ( options && options.quoteStrings && typeof value === 'string' ) return '"' + value + '"'

    if ( value === '' ) return '<empty string>'

    return String(value);
};

var buildValue= function( name, type, valueFn, info ) {
    var result= {
        name: name,
        type: type,
        valueText: function() {
            return valueToString(valueFn());
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
            SpongeTools.injectVar(valueContext, injectPrefix + name, (info[name] || {}).default),
            info[name] // info
        );
    });
};

var defaultLocationFn= function( text, location ) {
    return '<a href="#" class="location" lon="' + location[0] + '" lat="' + location[1] + '">' + text + '</a>';
};

SpongeTools.valueToString= valueToString;
SpongeTools.buildValues= buildValues;
SpongeTools.buildValue= buildValue;

SpongeTools.dateToString= dateToString;
SpongeTools.timeToString= timeToString;

SpongeTools.defaultLocationFn= defaultLocationFn;
