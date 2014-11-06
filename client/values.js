
var $arrayToString= function( value, options ) {
    options= _.extend({ quoteStrings: true }, options);
    return '[ ' + value.$array.map(function(v) { return _valueToString(v, options); } ).join(', ') + ' ]';
};

var $rangeToString= function( value, options ) {
    options= _.extend({ quoteStrings: true }, options);
    return 'From: ' + _valueToString(value.$range.from, options)
        + ' To: '   + _valueToString(value.$range.to, options)
        + ' Step: ' + _valueToString(value.$range.step, options);
};

var pad= function( value, count ) {
    if ( !count ) count= 2;
    value= String(value);
    while ( value.length < count ) value= '0' + value;
    return value;
};

var dateToString= function( value, options ) {
    return pad(value.getUTCFullYear(), 4) + '-' + pad(value.getUTCMonth() + 1) + '-' + pad(value.getUTCDate());
};
var timeToString= function( value, options ) {
    return pad(value.getUTCHours()) + ':' + pad(value.getUTCMinutes()) + ':' + pad(value.getUTCSeconds());
};

var _dateToString= function( value, options ) {
    return dateToString(value, options) + ' ' + timeToString(value, options);
};

var locationToString= function( value, options ) {
    return '<a href="#" class="location" lon="' + value[0] + '" lat="' + value[1] + '">' + value.slice().reverse().join(', ') + '</a>';
};

var _getObject= {
    'Model': SpongeTools.getCachedData('getModel'),
    'DataObj': SpongeTools.getCachedData('getDataObject'),
};

var dataObjectToString= function( value, options ) {
    if ( 'name' in value ) return value.name;

    var collection= value._ref;
    var id= (value.selector || {})._id;

    var name;
    if ( collection in _getObject && id ) {
        var object= _getObject[collection](id);
        if ( object ) name= object.name;
    }
    if ( !name ) name= _valueToString(id);

    if ( collection === 'DataObj' ) return name;

    return collection + ' ' + name;
};

var selectorToString= function( sel, nameProperty ) {
    if ( !sel ) return '&lt;empty&gt;';

    sel= _.clone(sel);

    var result= [];

    if ( nameProperty && nameProperty in sel ) {
        result.push(_valueToString(sel[nameProperty], { quoteStrings: true }));
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

        return prop + '=' + _valueToString(value, { quoteStrings: true });
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
    if ( !value.length ) return '&lt;empty Array&gt;';

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
                return '<tr><td>' + i + '</td>' + keys.map(function( k ) { return '<td>' + _valueToString(o[k], options) + '</td>' }).join('') + '</tr>';
            }).join('')
            + '</table>'
            ;
    }

    return '<table class="value array" width="100%">'
        + value.map(function( v, i ) { return '<tr><td class="value arrayIndex">' + i + '</td><td class="value arrayValue">' + _valueToString(v, options) + '</td></tr>'; }).join('')
        + '</table>';
};

var objectToString= function( value, options ) {
    var keys= Object.keys(value);
    if ( !keys.length ) return '&lt;empty Object&gt;';

    return '<table class="value object" width="100%">'
        + keys.map(function( key ) { return '<tr valign="top"><td class="value objectKey">' + key + '</td><td class="value objectValue">' + _valueToString(value[key], options) + '</td></tr>'; }).join('')
        + '</table>';
};

var colorToString= function( value, options ) {
    var color= value.substr(6, 2) + value.substr(4, 2) + value.substr(2, 2);
    var alpha= Math.round(parseInt(value.substr(0, 2), 16) / 2.55);

    return ''
        + '<div class="colored-spot-border">'
            + '<div class="colored-spot" style="background-color: #' + color + ';"></div>'
            + '<div class="colored-spot" style="background-color: #' + color + '; opacity: ' + (alpha / 100) + '; filter:alpha(opacity=' + alpha + ');"></div>'
        + '</div>';
}

var setToString= function( value, options ) {
    return '[' + (value || []).join(', ') + ']';
}

var defaultHandler= {
    onDate:     _dateToString,
    onObjectId: function( value ) { return 'ObjectId("' + value + '")'; },
    onLocation: locationToString,
    onArray:    arrayToString,
    on$array:   $arrayToString,
    on$range:   $rangeToString,
    onMap:      mapToString,
    onNearest:  nearestToString,
    onDataObject: dataObjectToString,
    onObject:   objectToString,
    onColor:    colorToString,
    onSet:      setToString,
    onString:   function( value, options ) {
        if ( options && options.quoteStrings ) return '"' + value + '"';
        return String(value);
    },
};

var getHandler= function( value, options ) {
    if ( options && options.type === 'Color' )
                                        return 'onColor';

    if ( options && options.type === 'Set' )
                                        return 'onSet';

    if ( typeof value !== 'object' )    return 'onString'
    if ( value instanceof Date )        return 'onDate';
    if ( value instanceof Meteor.Collection.ObjectID )
                                        return 'onObjectId';
    if ( _.isArray(value) ) {
        if ( value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' ) return 'onLocation';

        return 'onArray';
    }
    if ( '$array' in value )            return 'on$array';
    if ( '$range' in value )            return 'on$range';
    if ( String(value.type).toLowerCase() === 'map' )
                                        return 'onMap';
    if ( String(value.type).toLowerCase() === 'nearest' )
                                        return 'onNearest';
    if ( '_ref' in value || 'type' in value )
                                        return 'onDataObject';
    if ( value.constructor === Object ) return 'onObject';

    return 'onString';
};

var _valueToString= function( value, options ) {
    if ( value === undefined || value === null ) return '&lt;empty&gt;';

    if ( value === '' ) return '&lt;empty string&gt;'

    // transform complete data objects to references
    if ( typeof value === 'object' && '_id' in value && '_ref' in value ) {
        value= { _ref: value._ref, selector: { _id: value._id, }, };
    }

    var onName= getHandler(value, options);

    if ( !options || !(onName in options) ) return defaultHandler[onName](value, options);

    var onValue= options[onName];
    return typeof onValue === 'function' ? onValue( value, options, defaultHandler[onName] ) : onValue;
};

/**
 * make every result a SafeString
 */
var valueToString= function() {
    var value= _valueToString.apply(null, arguments);
    return value ? new Spacebars.SafeString(value) : value;
};

var buildValue= function( name, type, valueFn, info ) {
    return {
        name: name,
        type: type,
        valueText: function() {
            return valueToString(
                valueFn(),
                {
                    onLocation: function( value, options, defaultFn ) {
                        return $(defaultFn(value, options)).html();
                    },
                    type: type,
                }
            );
        },
        getValue: function() { return valueFn(); },
        setValue: function( newValue ) { valueFn(newValue); },
        info: info || {},
    };
};

var valueSort= function( a, b ) {
    var indexA= a.info.index || 0;
    var indexB= b.info.index || 0;

    // if at least one index is set sort by index
    if ( indexA || indexB ) return indexA - indexB;

    var optA= !!a.info.optional;
    var optB= !!b.info.optional;
    if ( optA !== optB ) return optA - optB;

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

var buildValues= function( args, property, valueContext, lastValue ) {
    var info= args.info && args.info[property] || {};

    if ( !lastValue ) lastValue= {};

    var injectPrefix= 'args.' + property + '.';

    var result= Object.keys(args[property]).map(function( name ) {
        return buildValue(
            name,
            args[property][name], // type
            SpongeTools.injectVar(valueContext, injectPrefix + name, name in lastValue ? lastValue[name] : (info[name] || {}).default),
            info[name] // info
        );
    });

    result.sort(valueSort);

    return result;
};

SpongeTools.indexSortFn= valueSort;

SpongeTools.valueToString= valueToString;
SpongeTools.buildValues= buildValues;
SpongeTools.buildValue= buildValue;

SpongeTools.dateToString= dateToString;
SpongeTools.timeToString= timeToString;

SpongeTools.defaultValueHandler= defaultHandler;
