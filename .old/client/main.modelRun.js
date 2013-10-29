
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

var _runModel= DataObjectTools.getCachedData('startJob');
var runModel= function( args ) {
    return _runModel({
        modelId: DataObjectTools.modelId(),
        args: args,
    });
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

var onClose= undefined;

var parseArgs= function( args ) {
    if ( !args ) return args;

    var result= {};
    args.forEach(function( arg ) {
        result[arg.name]= arg.getValue();
    });
    return result;
};

Template.modelRunBody.getArgs= function() {
    var args= getModelArgs();
    if ( !args ) return;

    var self= this;

    var result= {};

    [ 'args', 'inputs' ].forEach(function( property ) {
        if ( !args[property] ) return;

        result[property]= DataObjectTools.buildValues(args, property, self);
    });

    onClose= function() {
        return runModel({
            args: parseArgs(result.args),
            input: parseArgs(result.input),
        });
    };

    return result;
};

Template.modelRunBody.events({
    'click a.editValue': function( event ) {
        injectGlobalVar('valueInput')(this);
        DataObjectTools.showModal($('#valueInput'));
    },
});


$(function() {
    $('body').delegate('#modelRun button.btn-primary', 'click', function() {
        $('#modelRun').modal('hide');
        if ( !onClose ) return;

        var _onClose= onClose;
        onClose= undefined;
        return _onClose();
    });
});
