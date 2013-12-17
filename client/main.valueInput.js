
var getMatchingTypes= SpongeTools.getCachedData('getMatchingTypes');
var getMatchingObjects= SpongeTools.getCachedData('getMatchingObjects');
var getTags= SpongeTools.getCachedData('getTagsByTypeVersion');
var getMapnames= SpongeTools.getCachedData('getMapnamesByTypeVersion');

var ObjectId= SpongeTools.ObjectId;

var injectVar= SpongeTools.injectVar;
var injectGlobalVar= SpongeTools.injectGlobalVar;

var currentValue;
var tempValue= {};
var invalidData= {};

// maximum number of object's names to load
var limitDataObjs= 30;

var dateFormat= 'dd.mm.yyyy';

var T= SpongeTools.Template;

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
var getNewValueInit= function( defaultValue ) {
    var result= newValue();
    return result === undefined ? newValue(defaultValue) : result;
};

var singleValue= {
    get: function() {},
    set: function() {},
    type: undefined,
    description: undefined,
    newValue: undefined,
};

/*
 * invalidate a template
 */
var _invalidateCounter= 0;
var invalidate= function( name ) {
    return injectVar(invalidData, name)(_invalidateCounter++);
};
var isInvalid= function( name ) {
    return injectVar(invalidData, name)();
};

/*
 * gets the current value to edit
 * if value has changed, reset temporary values
 */
var getValue= function() {
    var value= injectGlobalVar('valueInput')();
    if ( value === currentValue ) return value;

    currentValue= value;

    // empty current values
    tempValue= {};
/*
    if ( tempValue._meta ) {
        Object.keys(tempValue._meta).slice().forEach(function( property ) {
            delete tempValue._meta[property];
        });
    }
*/
    return value;
};

var getType= function() {
    return (getValue() || {}).type;
};

/*
 * TEMPLATE valueInputTitle
 * shows title and description of value to change/inspect
 */

T.select('valueInputTitle');

T.helper('title', function() {
    var value= getValue();
    if ( ! value ) return;

    return value.name;
});

T.helper('description', function() {
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
        if ( type.value === currentInputType ) type.checked= 'checked';
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
    var type= inputType();
    if ( !type ) return;

    return new Handlebars.SafeString(Template['inputType' + type.charAt(0).toUpperCase() + type.slice(1)]());
});

$(function() {
    $('body').delegate('#valueInput button.btn-primary', 'click', function() {
        var value= getValue();
        if ( value ) value.setValue(newValue());
        $('#valueInput').modal('hide');
    });
});

var valueToString= function( value ) {
    return SpongeTools.valueToString(
        value,
        {
            onLocation: function( value, options, defaultFn ) {
                return $(defaultFn(value, options)).html();
            }
        }
    );
};

/*
 * TEMPLATE inputTypeSingle
 * shows a single value to edit
 */

T.select('inputTypeSingle');

T.helper('value', function() {
    return valueToString(newValue());
});

T.events({
    'click a.value': function() {
        showSingleValue({
            get: function() { return newValue(); },
            set: function( value ) { newValue(value); },
            type: getType(),
        });
    }
});

/*
 * TEMPLATE inputTypeArray
 * shows an array of values to edit
 */

T.select('inputTypeArray');

T.helper('values', function() {
    isInvalid('arraylist');

    var currentValue= getNewValueInit({ $array: [] });

    return currentValue.$array.map(function( value, i ) {
        return {
            index: i,
            value: function( newValue ) {
                if ( arguments.length ) {
                    currentValue.$array[i]= newValue;
                    invalidate('arraylist');
                }
                return currentValue.$array[i];
            },
        };
    });
});

T.helper('value', function() {
    return valueToString(this.value && this.value());
});

T.events({
    'click a.remove': function( event ) {
        getNewValueInit({ $array: [] }).$array.splice(this.index, 1);
        invalidate('arraylist');
    },
    'click a.add': function( event ) {
        var array= getNewValueInit({ $array: [] }).$array;
        var index= array.length;
        array.push(undefined);
        invalidate('arraylist');

        // open newly added value in singleValueInput
        sshowSingleValue({
            get: function() { return array[index]; },
            set: function( value ) {
                array[index]= value;
                invalidate('arraylist');
            },
            type: getType(),
        });
    },
    'click a.value': function() {
        var self= this;
        var v= self.value || function() {};
        showSingleValue({
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: getType(),
        });
    }
});

/*
 * TEMPLATE inputTypeRange
 * shows a range of values
 */

T.select('inputTypeRange');

var buildRangeValue= function( name ) {
    var $range= getNewValueInit({ $range: {} }).$range;
    return function( newValue ) {
        if ( arguments.length ) {
            invalidate('rangeview.' + name);
            $range[name]= newValue;
        }
        return $range[name];
    };
};

T.helper('valueFrom', function() {
    isInvalid('rangeview.from');
    var value= buildRangeValue('from')
    return { value: value, valueText: function() { return valueToString(value()); } };
});

T.helper('valueTo', function() {
    isInvalid('rangeview.to');
    var value= buildRangeValue('to')
    return { value: value, valueText: function() { return valueToString(value()); } };
});

T.helper('valueStep', function() {
    isInvalid('rangeview.step');
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
        });
    }
});


/*
 * TEMPLATE singleValueInputBody
 * shows input for a single value.
 * selects template by type
 */

T.select('singleValueInputBody');

T.helper('input', function() {
    isInvalid('singlevalue');

    if ( !singleValue ) return;

    var type= singleValue.type;

    if ( !type ) return;

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
            templateName+= type; break;
        default: 
            templateName+= 'Model';
            buildContextForModel();
            break;
    }

    if ( !Template[templateName] ) return;

    Template[templateName].init();
    return new Handlebars.SafeString(Template[templateName]());
});






/**
 * TEMPLATE valueInput
 */

var buildContextForModel= function() {
    var result= getMatchingTypes(singleValue.type);

    var typeNames= [];

    if ( !result ) return { typeName: typeNames };

    result.requestedType= singleValue.type;

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
    return singleValue.get();
};

var simpleValueEvents= {
    'change input': function( event ) {
        var newValue= event.currentTarget.value;
        switch ( singleValue.type ) {
            case 'Integer': newValue= parseInt(newValue, 10); break;
            case 'Double':  newValue= parseFloat(newValue); break;
        }
        singleValue.newValue= newValue;
    },
};


var singleValueCleanup= [];

$(function() {
    $('body').delegate('#singleValueInput button.btn-primary', 'click', function() {
        singleValue.set(singleValue.newValue);
        $('#singleValueInput').modal('hide');
    });
    $('body').delegate('#singleValueInput', 'hide', function() {
        while ( singleValueCleanup.length ) {
            var $element= $(singleValueCleanup.shift())
            $element.detach();
        }
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

    T.change('init', function() {
        singleValue.newValue= singleValue.get();
    });
    T.change('rendered', function() {
        var input= this.find('input, select');
        if ( input ) input.focus();
    });
});

T.select('valueInputConst');

T.helper('values', function() {
    var values= (singleValue.info || {}).const;
    if ( !values ) return;

    return values.map(function( v ) {
        return {
            value: v,
            selected: singleValue.newValue === v ? 'selected' : '',
        };
    });
});

T.events({
    'change select': function( event ) {
        singleValue.newValue= event.currentTarget.value;
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

T.change('rendered', function() {
    var self= this;
    var $modal= $('#singleValueInput');
    var $input= $(this.find('input.color'));

    var c= getColor(singleValue ? singleValue.get() : 0);

console.log(c)
console.log('rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')');
    $input.colorpicker({
        format: 'rgba',
        value: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')',
    }).on('changeColor', function( event ) {
        var rgba= event.color.toRGB();
        singleValue.newValue= hexPad(rgba.a * 255) + hexPad(rgba.b) + hexPad(rgba.b) + hexPad(rgba.r);
/*
    }).on('create', function( event ) {
        event.color.setColor('rgba(' + c.r + ',' + c.g + ',' + c.b + ')');
        event.color.setAlpha(c.a);
*/
    })
    .focus();
});


T.select('valueInputDate');

T.change('rendered', function() {
    var self= this;
    var $modal= $('#singleValueInput');
    var $input= $(this.find('input'));
    $input.datepicker({
        format: dateFormat,
        weekStart: 1,
        viewMode: 'years',
    }).on('show', function( event ) {
        var zindex= $modal.css('z-index');
        $('.datepicker').css('z-index', zindex + 1);
    }).on('changeDate', function( event ) {
        singleValue.newValue= new Date(Date.UTC(event.date.getFullYear(), event.date.getMonth(), event.date.getDate()));
    }).on('change', function( event ) {
        var $this= $(this);
        $this.datepicker('setValue', $this.val());
        var date= $input.data('datepicker').date;
        singleValue.newValue= new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    }).focus();
    var startValue= singleValue.get();
    if ( startValue ) {
        $input.datepicker('setValue', startValue);
    }
    singleValueCleanup.push($input.data().datepicker.picker);
});

T.select('valueInputLocation');
T.helper('lat', function() {
    return (singleValue.newValue || [])[1];
});
T.helper('lon', function() {
    return (singleValue.newValue || [])[0];
});
var _genSetLocation= function( index ) {
    return function( event ) {
        if ( !_.isArray(singleValue.newValue) ) singleValue.newValue= [];
        singleValue.newValue[index]= parseFloat(event.currentTarget.value);
    };
};
T.events({
    'change input.lat': _genSetLocation(1),
    'change input.lon': _genSetLocation(0),
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
    var value= getValue();
    if ( !value ) {
        return {
            schemas: [],
            models: [],
        };
    }

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

    if ( compatibleTypes.models.length ) {
        typeNames.Model= undefined;
    }

    compatibleTypes.schemas.forEach(function( schema ) {
        if ( !(schema.objectType in typeNames) ) typeNames[schema.objectType]= [];
        typeNames[schema.objectType].push(schema);
    });

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

    if ( !value ) getTempValue('modelVariant')(buildTypeNames()[0]);

    return value && value.label;
});

T.events({
    'click li.type': function( event ) {
        getTempValue('modelVariant')(this);
    },
    'change select': function( event ) {
        var selectedType= getTempValue('modelVariant')();

        if ( !selectedType ) return;

        singleValue.newValue= {
            $ref: selectedType.schemas ? 'DataObj' : 'Model',
            selector: {
                _id: new ObjectId(event.currentTarget.value),
            },
       };
    },
});

var getCompatibleObjects= function() {
    var selectedType= getTempValue('modelVariant')();

    if ( !selectedType ) return;

    // Model
    if ( selectedType.schemas === undefined ) {
        var compatibleTypes= getCompatibleTypes();
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
    return getCompatibleObjects() === undefined;
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
    if ( !singleValue.newValue ) return;

    var id= (singleValue.newValue.selector || {})._id;
    if ( !id ) return;

    if ( typeof id.toHexString === 'function' ) id= id.toHexString();
    if ( id === this.id ) return 'SELECTED';
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

        if ( this.id === selectorId ) return 'SELECTED';
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
    return getNewValueInit({ type: 'Nearest', selector: { objectType: undefined, version: undefined, tags: undefined, }, });
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
    if ( getNearestValue().selector.tags === String(this) ) return 'SELECTED';
});

T.events({
    'change select.tagName': function( event ) {
        var tag= $(event.target).val();

        setNearestSelector({ tags: tag, });
    },
});




T.select('inputTypeMap');

var getMapValue= function() {
    return getNewValueInit({ type: 'Map', selector: { objectType: undefined, version: undefined, mapname: undefined, }, });
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

    var version;
    if ( typeof sel.version === 'object' && sel.version.$in ) {
        version= sel.version.$in;
    }
    else {
        version= [sel.version];
    }

    var maps= getMapnames(sel.objectType, version);
    if ( !maps || maps.length === 0 ) return;

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
    if ( getMapValue().selector.mapname === String(this) ) return 'SELECTED';
});

T.events({
    'change select.mapName': function( event ) {
        var mapname= $(event.target).val();

        setMapSelector({ mapname: mapname, });
    },
});


var showSingleValue= function( _singleValue ) {
    singleValue= _singleValue;
    invalidate('singlevalue');
    SpongeTools.showModal($('#singleValueInput'));
};

SpongeTools.showSingleValueDialog= showSingleValue;
