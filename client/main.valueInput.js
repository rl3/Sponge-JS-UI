
var getMatchingTypes= SpongeTools.getCachedData('getMatchingTypes');
var getMatchingObjects= SpongeTools.getCachedData('getMatchingObjects');
var getTags= SpongeTools.getCachedData('getTagsByTypeVersion');
var getMapnames= SpongeTools.getCachedData('getMapnamesByTypeVersion');

var _getObjectsByLocation= SpongeTools.getCachedData('getObjectsByLocation');
var getObjectsByLocation= function( type, versions, bounds ) {
    bounds= _.clone(bounds)
    bounds.east= Math.min(Math.floor(bounds.east + 1), 180);
    bounds.west= Math.floor(bounds.west);
    bounds.north= Math.min(Math.floor(bounds.north + 1), 90);
    bounds.south= Math.floor(bounds.south);
    return _getObjectsByLocation(type, versions, bounds);
};

var ObjectId= SpongeTools.ObjectId;

var ReactiveValue= SpongeTools.ReactiveValue;
var injectVar= SpongeTools.injectVar;
var injectGlobalVar= SpongeTools.injectGlobalVar;

var globalInvalidator= SpongeTools.getInvalidator('valueInput');

var currentValue;
var tempValue= {};

var arraylistInvalidator= SpongeTools.getInvalidator('arraylist');
var rangeviewInvalidator= SpongeTools.getObjectInvalidator('rangeview');

// maximum number of object's names to load
var limitDataObjs= 30;

var dateFormat= 'dd.mm.yyyy';

var T= SpongeTools.Template;

var selectFromMapInvalidator= SpongeTools.getInvalidator('select from map');

var Map= SpongeTools.Map;

/*
 * generic local temporary value
 */
var getTempValue= function( name, initValue ) {
    return injectVar(tempValue, name, initValue);
};


var inputType= function() {
    return getTempValue('inputType').apply(null, arguments);
};

/*
 * stores new values per type
 */
var newValue= function( _newValue ) {
    var type= inputType();
    if ( !type ) return;

    return getTempValue(type + '.value').apply(null, arguments);
};
var getNewValueInit= function( type, defaultValue ) {
    var value= getTempValue(type + '.value');
    var result= value();

    return result === undefined ? value(defaultValue) : result;
};

var singleValue= ReactiveValue({
    get: function() {},
    set: function() {},
    type: undefined,
    description: undefined,
    newValue: undefined,
});

/*
 * gets the current value to edit
 * if value has changed, reset temporary values
 */
var getValue= function() {
    var value= injectGlobalVar('valueInput')();
    if ( value === currentValue ) return value;

    currentValue= value;

    // empty current values
    globalInvalidator(true);
    tempValue= {};

    return value;
};

var getType= function() {
    return (getValue() || {}).type;
};

var getInfo= function() {
    return (getValue() || {}).info;
};

/*
 * TEMPLATE valueInputTitle
 * shows title and description of value to change/inspect
 */

T.select('valueInputTitle');

T.helper('title', function() {
    globalInvalidator();
    var value= getValue();
    if ( ! value ) return;

    return value.name;
});

T.helper('description', function() {
    globalInvalidator();
    var value= getValue();
    if ( ! value ) return;

    return (value.info || {}).description;
});

var typeMapper= function( type ) {
    if ( typeof type === 'object' ) return 'object';

    switch( type ) {
        case 'Date':     return 'date';
        case 'Location': return 'location';
        case 'Double':   return 'number';
    }
    return 'value';
};



/*
 * TEMPLATE valueInputBody
 * show current value and allows to change value type (single, array, range...)
 */

T.select('valueInputBody');

T.helper('inputTypes', function() {
    globalInvalidator();
    var value= getValue();

    if ( !value ) return;

    var type= typeMapper(value.type);

    var currentInputType= inputType();

    // initialize inputType and newValue
    if ( currentInputType === undefined ) {
        var currentValue= value.getValue();

        // clone object
        currentValue= SpongeTools.clone(currentValue);

        currentInputType= 'single';
        if ( currentValue && typeof currentValue === 'object' ) {
            if ( '$array' in currentValue )             currentInputType= 'array';
            else if ( '$range' in currentValue )        currentInputType= 'range';
            else if ( String(currentValue.type).toLowerCase() === 'map' )
                                                        currentInputType= 'map';
            else if ( String(currentValue.type).toLowerCase() === 'nearest' )
                                                        currentInputType= 'nearest';
        }
        inputType(currentInputType);
        newValue(currentValue);
    }

    var result= [
        { value: 'single', label: 'single ' + type },
//        { value: 'array',  label: 'array of ' + type + 's' },
    ];

    if ( type === 'object' ) {
        result.push({ value: 'map',  label: 'map of objects' });
        result.push({ value: 'nearest',  label: 'nearest object by tag' });
    }
    else {
//        result.push({ value: 'range',  label: 'range of ' + type + 's' });
    }

    result.forEach(function( type ) {
        if ( type.value === currentInputType ) type.checked= true;
    });

    return result;
});

T.events({
    'change input[name="inputTypes"]': function( event ) {
        inputType(this.value);
        return false;
    },
});

T.helper('inputType', function() {
    globalInvalidator();
    return inputType();
});

T.helper('inputTypeTemplate', function() {
    globalInvalidator();
    var type= inputType();
    if ( !type ) return null;

    return Template['inputType' + type.charAt(0).toUpperCase() + type.slice(1)] || null;
});

$(function() {
    $('body').delegate('#valueInput button.saveValue', 'click', function() {
        var value= getValue();
        if ( value ) value.setValue(newValue());
        $('#valueInput').modal('hide');
    }).delegate('#valueInput button.clearValue', 'click', function() {
        var value= getValue();
        if ( value ) value.setValue(undefined);
        $('#valueInput').modal('hide');
    });
});

var valueToString= function( value, type ) {
    var options= {
        onLocation: function( value, options, defaultFn ) {
            return $(defaultFn(value, options)).html();
        }
    };
    if ( type ) options.type= type;

    return SpongeTools.valueToString(value, options);
};

/*
 * TEMPLATE inputTypeSingle
 * shows a single value to edit
 */

T.select('inputTypeSingle');

T.helper('value', function() {
    return valueToString(newValue(), getType());
});

T.events({
    'click a.value': function() {
        showSingleValue({
            get: function() { return newValue(); },
            set: function( value ) { newValue(value); },
            type: getType(),
            info: getInfo(),
        });
    }
});

/*
 * TEMPLATE inputTypeArray
 * shows an array of values to edit
 */

T.select('inputTypeArray');

var getArrayValue= function() {
    arraylistInvalidator();
    return getNewValueInit('array', { $array: [] });
};

T.helper('values', function() {
    var currentValue= getArrayValue();

    return currentValue.$array.map(function( value, i ) {
        return {
            index: i,
            value: function( newValue ) {
                if ( arguments.length ) {
                    currentValue.$array[i]= newValue;
                    arraylistInvalidator(true);
                }
                return currentValue.$array[i];
            },
            remove: function() {
                currentValue.$array.splice(i, 1);
                arraylistInvalidator(true);
            },
        };
    });
});

T.helper('value', function() {
    return valueToString(this.value && this.value());
});

T.events({
    'click a.remove': function( event ) {
        if ( this.remove ) this.remove();
    },
    'click a.add': function( event ) {
        var array= getArrayValue().$array;
        var index= array.length;
        array.push(undefined);
        arraylistInvalidator(true);

        // open newly added value in singleValueInput
        showSingleValue({
            get: function() { return array[index]; },
            set: function( value ) {
                array[index]= value;
                arraylistInvalidator(true);
            },
            type: getType(),
            info: getInfo(),
        });
    },
    'click a.value': function() {
        var v= this.value || function() {};
        showSingleValue({
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: getType(),
            info: getInfo(),
        });
    }
});

/*
 * TEMPLATE inputTypeRange
 * shows a range of values
 */

T.select('inputTypeRange');

var getRangeValue= function() {
    return getNewValueInit('range', { $range: {} });
};

var buildRangeValue= function( name ) {
    var $range= getRangeValue().$range;
    return function( newValue ) {
        if ( arguments.length ) {
            rangeviewInvalidator(name, true);
            $range[name]= newValue;
        }
        else {
            rangeviewInvalidator(name);
        }
        return $range[name];
    };
};

T.helper('valueFrom', function() {
    var value= buildRangeValue('from')
    return { value: value, valueText: function() { return valueToString(value()); } };
});

T.helper('valueTo', function() {
    var value= buildRangeValue('to')
    return { value: value, valueText: function() { return valueToString(value()); } };
});

T.helper('valueStep', function() {
    var value= buildRangeValue('step')
    return { value: value, valueText: function() { return valueToString(value()); } };
});

T.events({
    'click a.value': function() {
        var self= this;
        var v= self.value || function() {};
        showSingleValue({
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: getType(),
            info: getInfo(),
        });
    }
});


T.select('singleValueInputTitle');

T.helper('type', function() {
    var sv= singleValue();

    if ( !sv.type ) return;

    return SpongeTools.typeToString(sv.type);
});

T.helper('description', function() {
    var sv= singleValue();

    if ( !sv.info ) return;

    return (sv.info || {}).description;
});

/*
 * TEMPLATE singleValueInputBody
 * shows input for a single value.
 * selects template by type
 */

T.select('singleValueInputBody');

T.helper('input', function() {
    var sv= singleValue();

    var type= sv.type;

    if ( !type ) return null;

    var templateName= 'valueInput';

    switch ( type ) {
        case 'Double':
        case 'Integer':
        case 'Location':
        case 'Date':
        case 'String':
        case 'Boolean':
        case 'Const':
        case 'Color':
        case 'Set':
            templateName+= type; break;
        default: 
            templateName+= 'Model';
            buildContextForModel();
            break;
    }

    if ( !Template[templateName] ) return null;

    Template[templateName].init();
    return Template[templateName];
});






/**
 * TEMPLATE valueInput
 */

var buildContextForModel= function() {
    var sv= singleValue();

    if ( !sv.type ) return;

    var result= getMatchingTypes(sv.type);

    var typeNames= [];

    if ( !result ) return { typeName: typeNames };

    result.requestedType= sv.type;

    var setFn= function( typeName ) {
        injectVar(result, 'value')({
            label: typeName.label,
            type: typeName.type,
        });
    };

    if ( result.models && result.models.length ) typeNames.push({ label: 'Model', type: 'model', setType: setFn, });
    if ( result.schemas && result.schemas.length ) {
        typeNames.push({ label: 'DataObject Map', type: 'map', setType: setFn, });
        typeNames.push({ label: 'Nearest DataObject', type: 'nearest', setType: setFn, });
        typeNames.push({ label: 'DataObjects', type: 'dataObj', setType: setFn, });
    }

    result.typeName= typeNames;
    return result;
};


var simpleValueGet= function() {
    return singleValue().get();
};

var singleValueSetTemp= function( value ) {
    var sv= singleValue();
    if ( !sv ) return;

    sv.newValue= value;
    if ( sv.setTemp ) sv.setTemp(value);
};

var simpleValueEvents= {
    'change input': function( event ) {
        var newValue= event.currentTarget.value;
        var sv= singleValue();

        if ( !sv.type ) return;

        switch ( sv.type ) {
            case 'Integer': newValue= parseInt(newValue, 10); break;
            case 'Double':  newValue= parseFloat(newValue); break;
        }
        singleValueSetTemp(newValue);
    },
};


$(function() {
    $('body').delegate('#singleValueInput button.saveValue', 'click', function() {
        var sv= singleValue();

        sv.set(sv.newValue);
        $('#singleValueInput').modal('hide');
    }).delegate('#singleValueInput button.clearValue', 'click', function() {
        singleValue().set(undefined);
        $('#singleValueInput').modal('hide');
    }).delegate('#singleValueInput', 'hidden', function() {

        // do nothing, if another dialog opens
        if ( SpongeTools.Modal.isTempHiding() ) return;

        singleValue({
            get: function() {},
            set: function() {},
        });
    });
});


['Double', 'Integer', 'String'].forEach(function( type ) {
    var templateName= 'valueInput' + type;

    T.select(templateName);

    T.helper('value', simpleValueGet);
    T.events(simpleValueEvents);
});
['Double', 'Integer', 'String', 'Boolean', 'Model', 'Date', 'Location', 'Const', 'Color'].forEach(function( type ) {
    var templateName= 'valueInput' + type;

    T.select(templateName);

    T.addFn('init', function() {
        var sv= singleValue();

        sv.newValue= sv.get();
    });
    T.addFn('rendered', function() {
        var input= this.find('input, select');
        if ( input ) input.focus();
    });
});

T.select('valueInputBoolean');
T.helper('value', simpleValueGet);
T.helper('checked', function() {
    return !!simpleValueGet();
});
T.events({
    'change input': function( event ) {
        singleValueSetTemp(event.currentTarget.checked);
    },
});

T.select('valueInputConst');

T.helper('values', function() {
    var sv= singleValue();

    var values= (sv.info || {}).const;
    if ( !values ) return;

    return values.map(function( v ) {
        return {
            value: v,
            selected: sv.newValue === v,
        };
    });
});

T.events({
    'change select': function( event ) {
        singleValueSetTemp(event.currentTarget.value);
    }
});

T.select('valueInputSet');

T.addFn('init', function() {
    var sv= singleValue();
    var set= (sv.get() || []).slice();

    // if set consists of a single '*', select all values
    if ( set.length === 1 && set[0] === '*' ) set= ((sv.info || {}).const || []).slice();

    singleValueSetTemp(set);
});

var updateCBSelectAll= function( $container ) {
        var selectedCount= $container.find('input.value:checked').length;
        var valueCount= ((singleValue().info || {}).const || []).length;

        $cbSA= $container.find('input.select-all');
        $cbSA.prop('indeterminate', false);
        switch ( selectedCount ) {
            case 0: $cbSA.prop('checked', false); break;
            case valueCount: $cbSA.prop('checked', true); break;
            default: $cbSA.prop('indeterminate', true); break;
        }
};

T.addFn('rendered', function() {
    updateCBSelectAll($(this.find('table')));
});

T.helper('values', function() {
    var sv= singleValue();
    var values= (sv.info || {}).const;
    if ( !values ) return;

    return values.map(function( v ) {
        return {
            value: v,
            checked: sv.newValue.indexOf(v) >= 0,
        };
    });
});

T.events({
    'change input': function( event ) {
        var $cb= $(event.currentTarget);
        var value= event.currentTarget.value;

        var $parent= $cb.closest('table');

        var sv= singleValue();

        if ( $cb.hasClass('select-all') ) {
            var checked= $cb.prop('checked');
            $parent.find('input.value').prop('checked', checked);
            singleValueSetTemp(checked ? ((sv.info || {}).const || []) : []);
            return;
        }

        updateCBSelectAll($parent);

        var set= sv.newValue;

        if ( $cb.prop('checked') ) {
            if ( set.indexOf(value) < 0 ) set.push(value);
            return;
        }
        singleValueSetTemp(_.without(set, value));
    }
});


T.select('valueInputColor');

var hexPad= function( d ) {
    d= (d & 0xFF).toString(16);
    return d.length < 2 ? '0' + d : d;
};

var getColor= function( value ) {
    if ( !value ) value= 0;

    var intValue= parseInt(value, 16) || 0;

    return {
        r: intValue & 0xFF,
        g: (intValue >> 8) & 0xFF,
        b: (intValue >> 16) & 0xFF,
        a: ((intValue >> 24) & 0xFF + 0.0) / 255,
    };
};

T.addFn('rendered', function() {
    var self= this;
    var $modal= $('#singleValueInput');
    var $input= $(this.find('input.color'));

    var sv= singleValue();

    var c= getColor(sv ? sv.get() : 0);

    $input.colorpicker({
        format: 'rgba',
        color: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')',
    }).on('changeColor', function( event ) {
        var rgba= event.color.toRGB();
        singleValueSetTemp(hexPad(rgba.a * 255) + hexPad(rgba.b) + hexPad(rgba.g) + hexPad(rgba.r));
    })
    .focus();
});


T.select('valueInputDate');

T.addFn('rendered', function() {
    var self= this;
    var $modal= $('#singleValueInput');
    var $input= $(this.find('input'));
    $input.datepicker({
        format: dateFormat,
        weekStart: 1,
        viewMode: 'years',
    }).on('changeDate', function( event ) {
        singleValueSetTemp(new Date(Date.UTC(event.date.getFullYear(), event.date.getMonth(), event.date.getDate())));
    }).on('change', (function() {

        // semaphore to prevent calling 'change' during setValue
        var running= false;
        return function( event ) {
            if ( running ) return;
            var $this= $(this);
            running= true;
            $this.datepicker('setValue', $this.val());
            running= false;
            var date= $this.data('datepicker').dates.get();
            singleValueSetTemp(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
        };
    })()).focus();
    var startValue= singleValue().get();
    if ( startValue ) {
        $input.datepicker('setValue', startValue);
    }
});

T.select('valueInputLocation');

// lon lat -> internal representation
var defaultLocation= [13.012574, 52.438280];

T.helper('location', function() {
    return (singleValue().newValue || singleValue().get() || []).slice().reverse().join(', ');
});

T.helper('defaultLocation', function() {
    return defaultLocation[1] + ', ' + defaultLocation[0];
});

var setError= function( elem, error ) {
    $(elem).closest('.control-group').addClass( error ? 'error' : 'info').removeClass( error ? 'info' : 'error' );
}

T.events({
    'change input.location': function( event ) {
        var sv= singleValue();
        var value= event.currentTarget.value || '';

        if ( !value ) {
            singleValueSetTemp([]);
            return setError(event.currentTarget, false);
        }

        var match= value.match(/^(\d*\.?\d+)\,\s*(\d*\.?\d+)$/);
        if ( !match ) return setError(event.currentTarget, true);

        setError(event.currentTarget, false);
        singleValueSetTemp([ parseFloat(match[2]), parseFloat(match[1]) ]);
    },
    'click a.by-map': function( event ) {
        $cg= $(event.currentTarget).closest('.control-group');
        var sv= singleValue();
        var loc= sv.newValue;
        Map.clear();

        if ( !_.isArray(loc) || loc.length !== 2 ) loc= defaultLocation;

        Map.show(function() {
            Map.addMarker(loc, {
                infotext: '<b>current Value</b>',
                center: true,
            });

            Map.registerEventHandler('dblclick', function( event ) {
                if ( event && event.latLng ) {
                    var lon= event.latLng.lng();
                    var lat= event.latLng.lat()
                    singleValueSetTemp([ lon, lat ]);
                    $cg.find('input.location').val(lat + ', ' + lon);
                    Map.hide();
                }
            });
        });
    },
});








T.select('valueInputModel');

/*
 * delay key press for name filter
 */
var modelNameTimer= null;
T.events({
    'keypress input': function( event ) {
        var target= event.currentTarget;
        if ( modelNameTimer ) clearTimeout(modelNameTimer);

        modelNameTimer= setTimeout(function() {
            modelNameTimer= null;
            getTempValue('modelName')(target.value);
        }, 1000);
    },
});

var getCompatibleTypes= function() {
    var sv= singleValue();

    if ( sv && sv.getCompatibleTypes ) return sv.getCompatibleTypes();

    var value= getValue();

    if ( !value ) return;

    var compatibleTypes= getMatchingTypes( value.type );

    if ( compatibleTypes === undefined ) return;

    if ( !compatibleTypes ) compatibleTypes= {};

    if ( !compatibleTypes.schemas ) compatibleTypes.schemas= [];
    if ( !compatibleTypes.models )  compatibleTypes.models= [];

    return compatibleTypes;
};

var buildTypeNames= function() {
    var compatibleTypes= getCompatibleTypes();

    if ( !compatibleTypes ) return [];

    var typeNames= {};

    compatibleTypes.schemas.forEach(function( schema ) {
        if ( !(schema.objectType in typeNames) ) typeNames[schema.objectType]= [];
        typeNames[schema.objectType].push(schema);
    });

    if ( compatibleTypes.models.length ) {
        typeNames.Model= undefined;
    }

    return Object.keys(typeNames).map(function( name ) {
        return {
            label: name,
            schemas: typeNames[name],
        };
    });
};

T.select('valueInputModelSelector');

T.helper('loading', function() {
    return !getCompatibleTypes();
});

T.helper('typeName', buildTypeNames);

T.helper('currentLabel', function() {
    var value= getTempValue('modelVariant')();

    var typeNames= buildTypeNames();

    if ( !value || !_.contains(typeNames.map(function( name ) { return name.label }), value.label) ) {
        value= typeNames[0];
        getTempValue('modelVariant')(value);
    }

    return value && value.label;
});

T.events({
    'click li.type': function( event ) {
        getTempValue('modelVariant')(this);
    },
    'change select': function( event ) {
        var selectedType= getTempValue('modelVariant')();

        if ( !selectedType ) return;

        singleValueSetTemp({
            _ref: selectedType.schemas ? 'DataObj' : 'Model',
            selector: {
                _id: new ObjectId(event.currentTarget.value),
            },
       });
    },
    'click a.select-from-map': function( event ) {
        var objects= getCompatibleObjects() || [].filter(function( o ) { return 'location' in o; });
        if ( objects.length === 0 ) return;

        Map.clear();
        Map.show(function() {
            Map.registerEventHandler('bounds_changed', function( bounds ) {
                if ( !bounds ) return;

                selectFromMapInvalidator(true);
            });
            if ( !Map.getViewRange() ) Map.setViewRange([55, 15.3], [46.7, 5.7]);
        });

        return false;
    },
});

var getCompatibleObjects= function() {
    var selectedType= getTempValue('modelVariant')();

    var compatibleTypes= getCompatibleTypes();

    if ( !selectedType ) {
        if ( !compatibleTypes ) return;

        // return undefined only, if compatible items are found
        if ( compatibleTypes.models.length + compatibleTypes.schemas.length ) return;

        return [];
    }

    // Model
    if ( selectedType.schemas === undefined ) {
        if ( !compatibleTypes || compatibleTypes.model ) return [];

        return compatibleTypes.models.map(function( model ){
            return { _id: model._id, name: model.name };
        });
    }

    // Schemas
    return getMatchingObjects({
        objectType: selectedType.schemas[0].objectType,
        versions: selectedType.schemas.map(function( schema ) { return schema.version }),
        name: getTempValue('modelName', '')(),
        limit: limitDataObjs + 1,
    });
};

T.helper('loadingValues', function() {
    return !getCompatibleObjects();
});

T.helper('values', function() {
    var objects= getCompatibleObjects() || [];

    return objects.map(function( dataObj ) {
        return { id: dataObj._id.toHexString(), name: dataObj.name };
    });
});

T.helper('valueCount', function() {
    var count= (getCompatibleObjects() || []).length;

    return count > limitDataObjs ? limitDataObjs + '+' : count;
});

T.helper('selected', function() {
    var sv= singleValue();

    if ( !sv.newValue ) return;

    var id= (sv.newValue.selector || {})._id;
    if ( !id ) return;

    if ( typeof id.toHexString === 'function' ) id= id.toHexString();
    return id === this.id;
});


T.helper('selectFromMapHandler', function() {
    selectFromMapInvalidator();

    var bounds= Map.getViewRange();
    if ( !bounds ) return;

    var selectedType= getTempValue('modelVariant')();
    if ( !selectedType || !('schemas' in selectedType) ) return;

    var schemas= selectedType.schemas;
    if ( !schemas || !schemas.length ) return;

    var type= schemas[0].objectType;
    var versions= schemas.map(function( schema ) { return schema.version });

    var objects= getObjectsByLocation(type, versions, bounds);

    if ( !objects ) return;

    Map.clear();

    objects.forEach(function( o ) {
        var infotext= '<b>' + o.properties.name + '</b>';
        if ( o.properties.description ) {
            infotext+= '<br />' + o.properties.description;
        }
        if ( o.properties.start ) {
            infotext+= '<br /><b>Start:</b> ' + o.properties.start;
        }
        if ( o.properties.end ) {
            infotext+= '<br /><b>End:</b> ' + o.properties.end;
        }

        Map.addMarker(o.placemark, {
            infotext: infotext,
            events: {
                dblclick: function( event ) {
                    singleValueSetTemp({
                        _ref: selectedType.schemas ? 'DataObj' : 'Model',
                        selector: {
                            _id: new ObjectId(o.properties._id),
                        },
                    });
                    Map.hide();
                    $('#singleValueInput button.saveValue').click();
                },
            },
        });
    });
});




var commonNearestMapTypeMap= function() {
    var typeNames= buildTypeNames();

    return typeNames.filter(function( typeName ) { return typeName.schemas && typeName.schemas.length; }).map(function( typeName ) {
        var objectType= typeName.schemas[0].objectType;
        var versions= typeName.schemas.map(function( schema ) { return schema.version; });
        return {
            label: typeName.label,
            id: objectType + '|' + versions.join(','),
        }
    });
};

var commonNearestMapSelectedType= function( valueGetter ) {
    return function() {
        if ( !this.id ) return;

        var sel= valueGetter().selector;
        if ( !sel.version || !sel.version.$in ) return;

        var selectorId= sel.objectType + '|' + sel.version.$in.join(',');

        return this.id === selectorId;
    };
};

var commonNearestMapEvents= function( valueSetter ) {
    return {
        'change select.typeName': function( event ) {
            var id= $(event.target).val();
            var parts= id.split(/\|/, 2);
            var type= parts[0];
            var versions= (parts[1] || '').split(/,/).map(function( v ) { return +v; });

            valueSetter({ objectType: type, version: { $in: versions }, });
        },
    };
};

T.select('inputTypeNearest');

var getNearestValue= function() {
    return getNewValueInit('nearest', { type: 'Nearest', selector: { objectType: undefined, version: undefined, tags: undefined, }, });
};

var setNearestSelector= function( newSelector ) {
    var value= _.clone(getNearestValue());
    value.selector= _.extend(_.clone(value.selector), newSelector);
    return newValue(value);
};

T.helper('loadingTypeName', function() {
    return !getCompatibleTypes();
});

T.helper('typeName', commonNearestMapTypeMap);

T.helper('selectedType', commonNearestMapSelectedType(getNearestValue));

T.events(commonNearestMapEvents(setNearestSelector));

var _getTags= function() {
    var sel= getNearestValue().selector;

    var version;
    if ( typeof sel.version === 'object' && sel.version.$in ) {
        version= sel.version.$in;
    }
    else {
        version= [sel.version];
    }

    var tags= getTags(sel.objectType, version);
    if ( !tags || tags.length === 0 ) return;

    tags.sort();
    return tags;
};

T.helper('showTags', function() {
    var sel= getNearestValue().selector;
    return sel.objectType && sel.version;
});

T.helper('loadingTags', function() {
    return _getTags() === undefined;
});

T.helper('tag', _getTags);

T.helper('selectedTag', function() {
    return getNearestValue().selector.tags === String(this);
});

T.events({
    'change select.tagName': function( event ) {
        var tag= $(event.target).val();

        setNearestSelector({ tags: tag, });
    },
});




T.select('inputTypeMap');

var getMapValue= function() {
    return getNewValueInit('map', { type: 'Map', selector: { objectType: undefined, version: undefined, mapname: undefined, }, });
};

var setMapSelector= function( newSelector ) {
    var value= _.clone(getMapValue());
    value.selector= _.extend(_.clone(value.selector), newSelector);
    return newValue(value);
};

T.helper('loadingTypeName', function() {
    return !getCompatibleTypes();
});

T.helper('typeName', commonNearestMapTypeMap);

T.helper('selectedType', commonNearestMapSelectedType(getMapValue));

T.events(commonNearestMapEvents(setMapSelector));

var getMaps= function() {
    var sel= getMapValue().selector;

    var versions;
    if ( typeof sel.version === 'object' && sel.version.$in ) {
        versions= sel.version.$in;
    }
    else {
        versions= [sel.version];
    }

    var maps= getMapnames(sel.objectType, versions);
    if ( !maps || maps.length === 0 ) return;

    maps.sort();
    return maps;
};

T.helper('showMaps', function() {
    var sel= getMapValue().selector;
    return sel.objectType && sel.version;
});

T.helper('loadingMaps', function() {
    return getMaps() === undefined;
});

T.helper('map', getMaps);

T.helper('selectedMap', function() {
    return getMapValue().selector.mapname === String(this);
});

T.events({
    'change select.mapName': function( event ) {
        var mapname= $(event.target).val();

        setMapSelector({ mapname: mapname, });
    },
});


var showSingleValue= function( _singleValue ) {
    singleValue(_singleValue);
    SpongeTools.Modal.show($('#singleValueInput'));
};

SpongeTools.showSingleValueDialog= showSingleValue;


// export singleValue for 
SpongeTools.valueInput= {
    singleValue: function( data ) {
        singleValue({
            get: data.get,
            set: data.set,
            setTemp: data.setTemp,
            type: data.type,
            description: data.description,
            newValue: data.value,
            getCompatibleTypes: data.getCompatibleTypes,
        });
    },
    buildContextForModel: buildContextForModel,
};


