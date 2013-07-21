
var _getModel= DataObjectTools.getCachedData('getModel');
var getModel= function() {
    var modelId= DataObjectTools.modelId();
    if ( !modelId ) return;

    return _getModel(modelId);
};

var _getModelArgs= DataObjectTools.getCachedData('getModelArgs');
var getModelArgs= function() {
    var modelId= DataObjectTools.modelId();
    if ( !modelId ) return;

    return _getModelArgs(modelId);
};

var getMatchingObjects= DataObjectTools.getCachedData('getMatchingObjects');

Template.modelRunTitle.title= function() {
    var model= getModel();
    if ( model ) return model.name;
};

/**
 * TEMPLATE runModel
 */

Template.modelRunBody.getArgs= function() {
    var args= getModelArgs();
    if ( !args ) return;

    var result= {};

    if ( args.args ) {
        result.args= Object.keys(args.args).map(function(argName) {
            return {
                name: argName,
                type: args.args[argName],
            };
        });
    }
    if ( args.inputs ) {
        result.inputs= Object.keys(args.inputs).map(function(inputName) {
            return {
                name: inputName,
                type: args.input[inputName],
            };
        });
    }
    return result;
};

Template.modelRunBody.isRef= function() {
    return typeof this.type === 'object';
};

Template.modelRunBody.typeInput= function() {
    var templateName;
    switch ( this.type ) {
        case 'Double': templateName= 'Double'; break;
        case 'Location': templateName= 'Location'; break;
        case 'Date': templateName='Date'; break;
        default: 
            templateName= 'Model'; break;
    }

    if ( !templateName ) return;

    return new Handlebars.SafeString(Template['valueInput' + templateName](this));
};

var cleanType= function( type ) {
    var result= _.clone(type);
    if ( 'info' in result ) delete result.info;
    return result;
};

Template.valueInputModel.matching= function() {
    var result= getMatchingObjects(cleanType(this.type));
    var typeNames= [];

    var value= {
        type: undefined,
        value: undefined,
    }

    if ( result.models && result.models.length ) typeNames.push({ label: 'Model', type: 'model', value: value, });
    if ( result.schemas && result.schemas.length ) {
        typeNames.push({ label: 'AgroObjects', type: 'schemas', value: value, });
        typeNames.push({ label: 'AgroObject Map', type: 'schemas|Map', value: value, });
        typeNames.push({ label: 'Nearest AgroObject', type: 'schemas|Nearest', value: value, });
    }

    value.type= typeNames[0];

    result.typeName= typeNames;
    result.value= value;
    return result;
};

Template.valueInputModel.events({
    'click li[value]': function( event ) {
console.log(this);
        this.value.type= this;
console.log(this);
    },
});
