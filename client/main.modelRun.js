
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

var injectVar= DataObjectTools.injectVar;
var injectGlobalVar= DataObjectTools.injectGlobalVar;

Template.modelRunTitle.title= function() {
    var model= getModel();
    if ( model ) return model.name;
};

/**
 * TEMPLATE runModel
 */

var buildValues= function( args, property, valueContext ) {
    var injectPrefix= 'args.' + property + '.';
    return Object.keys(args[property]).map(function( name ) {
        var valueVar= injectVar(valueContext, injectPrefix + name, undefined);
        var result= {
            name: name,
            type: args[property][name],
            valueText: function() {
                return valueVar() === undefined ? '<empty>' : valueVar();
            },
            getValue: function() { return valueVar(); },
            setValue: function( newValue ) { valueVar(newValue); }
        };
        if ( args.info && args.info[property] && args.info[property][name] ) {
            result.info= args.info[property][name];
        }
        return result;
    });
};

Template.modelRunBody.getArgs= function() {
    var args= getModelArgs();
    if ( !args ) return;

    var self= this;

    var result= {};

    [ 'args', 'inputs' ].forEach(function( property ) {
        if ( !args[property] ) return;

        result[property]= buildValues(args, property, self);
    });

    return result;
};

Template.modelRunBody.events({
    'click a': function( event ) {
        injectGlobalVar('valueInput')(this);
        $('#valueInput').modal({ show: true, });
    },
});

