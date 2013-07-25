
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

var getMatchingTypes= DataObjectTools.getCachedData('getMatchingTypes');
var getMatchingObjects= DataObjectTools.getCachedData('getMatchingObjects');

var injectVar= DataObjectTools.injectVar;

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

var cleanType= function( type ) {
    var result= _.clone(type);
    if ( 'info' in result ) delete result.info;
    return result;
};

var buildContextForModel= function( context ) {
    var result= getMatchingTypes(cleanType(context.type));

    var typeNames= [];

    if ( !result ) return { typeName: typeNames };

    result.requestedType= context.type;

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
    var templateName;
    var context= this;
    switch ( this.type ) {
        case 'Double': templateName= 'Double'; break;
        case 'Location': templateName= 'Location'; break;
        case 'Date': templateName='Date'; break;
        default: 
            templateName= 'Model';
            context= buildContextForModel(this);
            break;
    }

    if ( !templateName ) return;

    return new Handlebars.SafeString(Template['valueInput' + templateName](context));
};

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
