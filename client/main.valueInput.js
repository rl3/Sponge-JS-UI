
var getMatchingTypes= DataObjectTools.getCachedData('getMatchingTypes');
var getMatchingObjects= DataObjectTools.getCachedData('getMatchingObjects');

var injectVar= DataObjectTools.injectVar;
var injectGlobalVar= DataObjectTools.injectGlobalVar;

var currentValue;
var tempValue= {};
var invalidData= {};

/*
 * generic local temporary value
 */
var getTempValue= function( name, initValue ) {
    return injectVar(tempValue, name, initValue);
};

/*
 * stores new values per type
 */
var getNewValue= function( initValue ) {
    var type= getTempValue('inputType')();
    if ( !type ) return function() {};

    return getTempValue(type + '.value', initValue);
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
console.log('invalidating', name);
    return injectVar(invalidData, name)(_invalidateCounter++);
};
var isInvalid= function( name ) {
console.log('isInvalid', name);
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
    if ( tempValue._meta ) {
        Object.keys(tempValue._meta).slice().forEach(function( property ) {
            delete tempValue._meta[property];
        });
    }
    return value;
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

    var currentValue= getTempValue('value')();
    if ( currentValue === undefined ) {
        currentValue= value.getValue();
        if ( typeof currentValue === 'object' ) {
            currentValue= JSON.parse(JSON.stringify(currentValue));
        }
        getTempValue('value')(currentValue);
    }

    var currentInputType= getTempValue('inputType')();
    if ( currentInputType === undefined ) {

console.log('currentType uninitialized', currentValue, value);
        currentInputType= 'single';
        if ( typeof currentValue === 'object' ) {
            if ( '$array' in currentValue )             currentInputType= 'array';
            else if ( '$range' in currentValue )        currentInputType= 'range';
            else if ( currentValue.type === 'map' )     currentInputType= 'map';
            else if ( currentValue.type === 'nearest' ) currentInputType= 'nearest';
        }
        getTempValue('inputType')(currentInputType);
        getNewValue()(currentValue);
    }

    var result= [
        { value: 'single', label: 'single ' + type },
        { value: 'array',  label: 'array of ' + type + 's' },
    ];

    if ( typeof value.type === 'object' ) {
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
        getTempValue('inputType')(this.value);
        return false;
    },
});

Template.valueInputBody.inputType= function() {
    var type= getTempValue('inputType')();
    if ( !type ) return;

    return new Handlebars.SafeString(Template['inputType' + type.charAt(0).toUpperCase() + type.slice(1)]());
};

$(function() {
    $('body').delegate('#valueInput button.btn-primary', 'click', function() {
        var value= getValue();
        if ( value ) value.setValue(getNewValue()());
        $('#valueInput').modal('hide');
    });
});

/*
 * TEMPLATE inputTypeSingle
 * shows a single value to edit
 */
Template.inputTypeSingle.value= function() {
    return DataObjectTools.valueToString(getNewValue()());
};

Template.inputTypeSingle.events({
    'click a.value': function() {
        singleValue= {
            get: function() { return getNewValue()(); },
            set: function( value ) { getNewValue()(value); },
            type: (getValue() || {}).type,
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

    var currentValue= getNewValue({ $array: [] })();

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
        getNewValue({ $array: [] })().$array.splice(this.index, 1);
        invalidate('arraylist');
    },
    'click a.add': function( event ) {
        getNewValue({ $array: [] })().$array.push(undefined);
        invalidate('arraylist');
    },
    'click a.value': function() {
        var self= this;
        var v= self.value || function() {};
        singleValue= {
            get: function() { return v(); },
            set: function( value ) { v(value); },
            type: (getValue() || {}).type,
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
    var $range= getNewValue({ $range: {} })().$range;
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
            type: (getValue() || {}).type,
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
        switch ( this.type ) {
            case 'Integer': newValue= parseInt(newValue, 10); break;
            case 'Double':  newValue= parseFloat(newValue); break;
        }
        singleValue.newValue= newValue;
    },
};


$(function() {
    $('body').delegate('#singleValueInput button.btn-primary', 'click', function() {
        singleValue.set(singleValue.newValue);
        $('#singleValueInput').modal('hide');
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

    Template[templateName].created= function() {
        singleValue.newValue= singleValue.get();
    };
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
}

Template.valueInputModelSelector.typeName= function() {
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

Template.valueInputModelSelector.events({
    'click li.type': function( event ) {
        getTempValue('modelVariant')(this);
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
        limit: 30,
    }) || [];
}

Template.valueInputModelSelector.values= function() {
    var objects= getCompatibleObjects();

    return objects.map(function( agroObj ) {
        return { id: agroObj._id.toHexString(), name: agroObj.name };
    });
};

Template.valueInputModelSelector.valueCount= function() {
    var count= getCompatibleObjects().length;

    return count == 0 ? '' : count;
};
