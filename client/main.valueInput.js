
var getMatchingTypes= DataObjectTools.getCachedData('getMatchingTypes');
var getMatchingObjects= DataObjectTools.getCachedData('getMatchingObjects');

var injectVar= DataObjectTools.injectVar;
var injectGlobalVar= DataObjectTools.injectGlobalVar;

var currentValue;
var tempValue= {};

var getTempValue= function( name, initValue ) {
    return injectVar(tempValue, name, initValue);
};

var getNewValue= function( initValue ) {
    var type= getTempValue('inputType')();
    if ( !type ) return function() {};

    return getTempValue(type + '.value', initValue);
};

var isInvalid= function() {
    return getTempValue('updated')();
};

var _invalidateCounter= 0;
var invalidate= function() {
    return getTempValue('updated')(_invalidateCounter++);
};

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

Template.valueInputBody.inputTypes= function() {
    var value= getValue();

    if ( !value ) return;

    var type= 'value';
    if ( typeof value.type === 'object' ) type= 'object';
    else if ( value.type === 'Date' )     type= 'date';
    else if ( value.type === 'Location' ) type= 'location';
    else if ( value.type === 'Double' )   type= 'number';

    var currentValue= getTempValue('value')();
    if ( currentValue === undefined ) {
        currentValue= value.getValue();
        getTempValue('value')(currentValue);
    }

    var currentInputType= getTempValue('inputType')();
    if ( currentInputType === undefined ) {
        currentInputType= 'single';
        if ( typeof currentValue === 'object' ) {
            if ( '$array' in currentValue )             currentInputType= 'array';
            else if ( '$range' in currentValue )        currentInputType= 'range';
            else if ( currentValue.type === 'map' )     currentInputType= 'map';
            else if ( currentValue.type === 'nearest' ) currentInputType= 'nearest';
        }
        getTempValue('inputType')(currentInputType);
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
    }
});

Template.valueInputBody.inputType= function() {
    var type= getTempValue('inputType')();
    if ( !type ) return;

    return new Handlebars.SafeString(Template['inputType' + type.charAt(0).toUpperCase() + type.slice(1)]());
};

Template.inputTypeSingle.value= function() {
    var getValue= getNewValue();
    return { value: getValue };
};

Template.inputTypeArray.values= function() {
    isInvalid();

    var currentValue= getNewValue({ $array: [] })();

    return currentValue.$array.map(function( value, i ) {
        return {
            index: i,
            value: function( newValue ) {
                if ( arguments.length ) currentValue.$array[i]= newValue;
                return currentValue.$array[i];
            },
        };
    });
};

Template.inputTypeArray.events({
    'click a.remove': function( event ) {
        getNewValue({ $array: [] })().$array.splice(this.index, 1);
        invalidate();
    },
    'click a.add': function( event ) {
        getNewValue({ $array: [] })().$array.push(undefined);
        invalidate();
    },
});

var buildRangeValue= function( name ) {
    var $range= getNewValue({ $range: {} })().$range;
    return function( newValue ) {
        if ( arguments.length ) $range[name]= newValue;
        return $range[name];
    };
};

Template.inputTypeRange.valueFrom= function() {
    return { value: buildRangeValue('from') };
};

Template.inputTypeRange.valueTo= function() {
    return { value: buildRangeValue('to') };
};

Template.inputTypeRange.valueStep= function() {
    return { value: buildRangeValue('step') };
};








/**
 * TEMPLATE valueInput
 */

var buildContextForModel= function() {
    var value= getValue();

    var result= getMatchingTypes(value.type);

    var typeNames= [];

    if ( !result ) return { typeName: typeNames };

    result.requestedType= value.type;

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


Template.valueInput.input= function() {
    var value= getValue();

    if ( !value ) return;

    var type= value.type;

    var templateName;

    switch ( type ) {
        case 'Double':
        case 'Integer':
        case 'Location':
        case 'Date':
        case 'String':
        case 'Boolean':
            templateName= type; break;
        default: 
            templateName= 'Model';
            buildContextForModel();
            break;
    }

    if ( !templateName ) return;

    return new Handlebars.SafeString(Template['valueInput' + templateName](value));
};

var simpleValueGet= function() {
    return this ? this.getValue() : undefined;
};

var simpleValueEvents= {
    'change input': function( event ) {
        if ( !this ) return;

        var newValue= event.currentTarget.value;
        switch ( this.type ) {
            case 'Integer': newValue= parseInt(newValue, 10); break;
            case 'Double':  newValue= parseFloat(newValue); break;
        }
        this.setValue(newValue);
    },
};

['Double', 'Integer', 'String'].forEach(function( type ) {
    Template['valueInput' + type].value= simpleValueGet;
    Template['valueInput' + type].events(simpleValueEvents);
});
















Template.valueInputModel.currentLabel= function() {
    var value= injectVar(this, 'value', {
        label: (this.typeName[0] || {}).label,
        type:  (this.typeName[0] || {}).type,
    })();
    return value.label;
}

Template.valueInputModel.events({
    'click li[value]': function( event ) {
        this.setType(this);
    },
});

Template.valueInputModel.values= function() {

    var value= injectVar(this, 'value')();
    if ( !value ) return;

    switch ( value.type ) {
        case 'model':
            return this.models.map(function( model ){
                return { id: model._id.toHexString(), name: model.name };
            });

        case 'map':
        case 'nearest':
            return this.schemas.map(function( schema ){
                return { id: schema.objectType + '::' + schema.version, name: schema.objectType + '/' + schema.version };
            });

        case 'agroObj':
            var result= getMatchingObjects(cleanType(this.requestedType));
            if ( !result || !result.agroObjs ) return;

            return result.agroObjs.map(function( agroObj ) {
                return { id: agroObj._id.toHexString(), name: agroObj.name };
            })
    }
};
