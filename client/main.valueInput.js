
var getMatchingTypes= DataObjectTools.getCachedData('getMatchingTypes');
var getMatchingObjects= DataObjectTools.getCachedData('getMatchingObjects');

var injectVar= DataObjectTools.injectVar;
var injectGlobalVar= DataObjectTools.injectGlobalVar;

var currentValue;
var tempValue= {};
var invalidData= {};

// maximum number of object's names to load
var limitAgroObjs= 30;

var dateFormat= 'dd.mm.yyyy';

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
Template.valueInputTitle.title= function() {
    var value= getValue();
    if ( ! value ) return;

    return value.name;
};

Template.valueInputTitle.description= function() {
    var value= getValue();
    if ( ! value ) return;

    return (value.info || {}).description;
};

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
Template.valueInputBody.inputTypes= function() {
    var value= getValue();

    if ( !value ) return;

    var type= typeMapper(value.type);

    var currentInputType= inputType();

    // initialize inputType and newValue
    if ( currentInputType === undefined ) {
        var currentValue= value.getValue();

        // clone object
        if ( typeof currentValue === 'object' ) {
            currentValue= JSON.parse(JSON.stringify(currentValue));
        }

        currentInputType= 'single';
        if ( currentValue && typeof currentValue === 'object' ) {
            if ( '$array' in currentValue )             currentInputType= 'array';
            else if ( '$range' in currentValue )        currentInputType= 'range';
            else if ( currentValue.type === 'map' )     currentInputType= 'map';
            else if ( currentValue.type === 'nearest' ) currentInputType= 'nearest';
        }
        inputType(currentInputType);
        newValue(currentValue);
    }

    var result= [
        { value: 'single', label: 'single ' + type },
        { value: 'array',  label: 'array of ' + type + 's' },
    ];

    if ( value.type === 'object' ) {
        result.push({ value: 'map',  label: 'map of objects' });
        result.push({ value: 'nearest',  label: 'nearest object by tag' });
    }
    else {
        result.push({ value: 'range',  label: 'range of ' + type + 's' });
    }

    result.forEach(function( type ) {
        if ( type.value === currentInputType ) type.checked= 'checked';
    });

    return result;
};

Template.valueInputBody.events({
    'change input[name="inputTypes"]': function( event ) {
        inputType(this.value);
        return false;
    },
});

Template.valueInputBody.inputType= function() {
    var type= inputType();
    if ( !type ) return;

    return new Handlebars.SafeString(Template['inputType' + type.charAt(0).toUpperCase() + type.slice(1)]());
};

$(function() {
    $('body').delegate('#valueInput button.btn-primary', 'click', function() {
        var value= getValue();
        if ( value ) value.setValue(newValue());
        $('#valueInput').modal('hide');
    });
});

/*
 * TEMPLATE inputTypeSingle
 * shows a single value to edit
 */
Template.inputTypeSingle.value= function() {
    return DataObjectTools.valueToString(newValue());
};

Template.inputTypeSingle.events({
    'click a.value': function() {
        singleValue= {
            get: function() { return newValue(); },
            set: function( value ) { newValue(value); },
            type: getType(),
        }
        invalidate('singlevalue');
        DataObjectTools.showModal($('#singleValueInput'));
    }
})

/*
 * TEMPLATE inputTypeArray
 * shows an array of values to edit
 */
Template.inputTypeArray.values= function() {
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
};

Template.inputTypeArray.value= function() {
    return DataObjectTools.valueToString(this.value && this.value());
}

Template.inputTypeArray.events({
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
        singleValue= {
            get: function() { return array[index]; },
            set: function( value ) {
                array[index]= value;
                invalidate('arraylist');
            },
            type: getType(),
        }
        invalidate('singlevalue');
        DataObjectTools.showModal($('#singleValueInput'));
    },
    'click a.value': function() {
        var self= this;
        var v= self.value || function() {};
        singleValue= {
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: getType(),
        }
        invalidate('singlevalue');
        DataObjectTools.showModal($('#singleValueInput'));
    }
});

/*
 * TEMPLATE inputTypeRange
 * shows a range of values
 */
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

Template.inputTypeRange.valueFrom= function() {
    isInvalid('rangeview.from');
    var value= buildRangeValue('from')
    return { value: value, valueText: function() { return DataObjectTools.valueToString(value()); } };
};

Template.inputTypeRange.valueTo= function() {
    isInvalid('rangeview.to');
    var value= buildRangeValue('to')
    return { value: value, valueText: function() { return DataObjectTools.valueToString(value()); } };
};

Template.inputTypeRange.valueStep= function() {
    isInvalid('rangeview.step');
    var value= buildRangeValue('step')
    return { value: value, valueText: function() { return DataObjectTools.valueToString(value()); } };
};

Template.inputTypeRange.events({
    'click a.value': function() {
        var self= this;
        var v= self.value || function() {};
        singleValue= {
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: getType(),
        }
        invalidate('singlevalue');
        DataObjectTools.showModal($('#singleValueInput'));
    }
});


/*
 * TEMPLATE singleValueInputBody
 * shows input for a single value.
 * selects template by type
 */
Template.singleValueInputBody.input= function() {
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
            templateName+= type; break;
        default: 
            templateName+= 'Model';
            buildContextForModel();
            break;
    }

    if ( !Template[templateName] ) return;

    Template[templateName].init();
    return new Handlebars.SafeString(Template[templateName]());
};






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
        typeNames.push({ label: 'AgroObject Map', type: 'map', setType: setFn, });
        typeNames.push({ label: 'Nearest AgroObject', type: 'nearest', setType: setFn, });
        typeNames.push({ label: 'AgroObjects', type: 'agroObj', setType: setFn, });
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

    if ( !(templateName in Template) ) return;

    Template[templateName].value= simpleValueGet;
    Template[templateName].events(simpleValueEvents);
});
['Double', 'Integer', 'String', 'Boolean', 'Model', 'Date', 'Location'].forEach(function( type ) {
    var templateName= 'valueInput' + type;

    if ( !(templateName in Template) ) return;

    Template[templateName].init= function() {
        singleValue.newValue= singleValue.get();
    };
    Template[templateName].rendered= function() {
        this.find('input').focus();
    }
});


Template.valueInputDate.rendered= function() {
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
        singleValue.newValue= event.date;
    });
    var startValue= singleValue.get();
    if ( startValue ) {
        $input.datepicker('setValue', startValue);
    }
    singleValueCleanup.push($input.data().datepicker.picker);
};

Template.valueInputLocation.lat= function() {
    return (singleValue.newValue || [])[1];
};
Template.valueInputLocation.lon= function() {
    return (singleValue.newValue || [])[0];
};
var _genSetLocation= function( index ) {
    return function( event ) {
        if ( !_.isArray(singleValue.newValue) ) singleValue.newValue= [];
        singleValue.newValue[index]= parseFloat(event.currentTarget.value);
    };
};
Template.valueInputLocation.events({
    'change input.lat': _genSetLocation(1),
    'change input.lon': _genSetLocation(0),
});









/*
 * delay key press for name filter
 */
var modelNameTimer= null;
Template.valueInputModel.events({
    'keypress input': function( event ) {
        var target= event.currentTarget;
        if ( modelNameTimer ) clearTimeout(modelNameTimer);

        modelNameTimer= setTimeout(function() {
            modelNameTimer= null;
            getTempValue('modelName')(target.value);
        }, 1000);
    },
});


Template.valueInputModelSelector.currentLabel= function() {
    var value= getTempValue('modelVariant')();

    if ( !value ) getTempValue('modelVariant')(buildTypeNames()[0]);

    return value && value.label;
};

var getCompatibleTypes= function() {
    var value= getValue();
    if ( !value ) {
        return {
            schemas: [],
            models: [],
        };
    }

    var compatibleTypes= getMatchingTypes( value.type ) || {};

    if ( !compatibleTypes.schemas ) compatibleTypes.schemas= [];
    if ( !compatibleTypes.models )  compatibleTypes.models= [];

    return compatibleTypes;
};

var buildTypeNames= function() {
    var compatibleTypes= getCompatibleTypes();

    var typeNames= compatibleTypes.schemas.map(function( schema ) {
        return {
            label: schema.objectType + '/' + schema.version,
            schema: schema,
        }
    });
    if ( compatibleTypes.models.length ) {
        typeNames.unshift({
            label: 'Model',
            schema: undefined,
        });
    }
    return typeNames;
};

Template.valueInputModelSelector.typeName= buildTypeNames;

Template.valueInputModelSelector.events({
    'click li.type': function( event ) {
        getTempValue('modelVariant')(this);
    },
    'change select': function( event ) {
        var selectedType= getTempValue('modelVariant')();

        if ( !selectedType ) return;

        singleValue.newValue= {
            $ref: selectedType.schema ? 'AgroObj' : 'Model',
            selector: {
                _id: event.currentTarget.value,
            },
       };
    },
});

var getCompatibleObjects= function() {
    var selectedType= getTempValue('modelVariant')();

    if ( !selectedType ) return [];

    if ( selectedType.schema === undefined ) {
        var compatibleTypes= getCompatibleTypes();
        return compatibleTypes.models.map(function( model ){
            return { id: model._id.toHexString(), name: model.name };
        });
    }

    return getMatchingObjects({
        objectType: selectedType.schema.objectType,
        version: selectedType.schema.version,
        name: getTempValue('modelName', '')(),
        limit: limitAgroObjs + 1,
    }) || [];
};

Template.valueInputModelSelector.values= function() {
    var objects= getCompatibleObjects();

    return objects.map(function( agroObj ) {
        return { id: agroObj._id.toHexString(), name: agroObj.name };
    });
};

Template.valueInputModelSelector.valueCount= function() {
    var count= getCompatibleObjects().length;

    return count == 0 ? '' : count > limitAgroObjs ? limitAgroObjs + '+' : count;
};

Template.valueInputModelSelector.selected= function() {
    if ( !singleValue.newValue ) return;

    if ( (singleValue.newValue.selector || {})._id === this.id ) return 'SELECTED';
};
