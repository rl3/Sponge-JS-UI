
var T= DataObjectTools.Template;

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
var runModel= function( args, details ) {
    return _runModel(DataObjectTools.modelId(), args, details, function() {
        DataObjectTools.invalidateJobList(true);
    });
};

var injectVar= DataObjectTools.injectVar;
var injectGlobalVar= DataObjectTools.injectGlobalVar;

T.select('modelRunTitle');

T.helper('title', function() {
    var model= getModel();
    if ( model ) return model.name;
});

/**
 * TEMPLATE runModel
 */

T.select('modelRunBody');

T.helper('defaultJobTitle', function() {
    var model= getModel();

    if ( !model ) return;

    return model.name;
});

var pad= function(v) {
    v= String(v);
    if ( v.length < 2 ) v= '0' + v;
    return v;
}

T.helper('defaultJobDescription', function() {
    var now= new Date();
    return 'started at ' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
});

T.select('modelRunArgs');

var onClose= undefined;
var verifyArgs= undefined;

var parseArgs= function( args ) {
    if ( !args ) return args;

    var result= {};
    args.forEach(function( arg ) {
        result[arg.name]= arg.getValue();
    });
    return result;
};

var validateArgs= function( args ) {
    if ( !args ) return true;

    for ( var name in args ) {
        if ( typeof args[name] === 'undefined' ) {
console.log('Arg ' + name + ' is undefined')
            return false;
        }
    }
    return true;
};

T.helper('getArgs', function() {
    var args= getModelArgs();
    if ( !args ) return;

    var self= this;

    var result= {};

    [ 'args', 'inputs' ].forEach(function( property ) {
        if ( !args[property] ) return;

        result[property]= DataObjectTools.buildValues(args, property, self);
    });

    verifyArgs= function() {
        var args= parseArgs(result.args);

        return validateArgs(args);// && validateArgs(inputs);
    };

    onClose= function() {
        runModel({
            args: parseArgs(result.args),
//            input: parseArgs(result.inputs),
        },
        {
            description: getDescription(),
        });
    };

    return result;
});

T.events({
    'click a.editValue': function( event ) {
        injectGlobalVar('valueInput')(this);
        DataObjectTools.showModal($('#valueInput'));
    },
});

var getDescription= function() {
    var $base= $('#modelRun');
    return {
        title: $base.find('[name="job-title"]').val(),
        text: $base.find('[name="job-description"]').val(),
    };
};

var validateForm= function() {
    var desc= getDescription();

    if ( !desc.title || !desc.text ) return false;

    if ( verifyArgs ) return verifyArgs();
};

$(function() {
    $('body').delegate('#modelRun button.btn-primary', 'click', function() {

        if ( !validateForm() ) {
            alert('You have to set all arguments and\nenter a valid title and description for this job!');
            return;
        }

        $('#modelRun').modal('hide');
        if ( !onClose ) return;

        var _onClose= onClose;
        onClose= undefined;
        verifyArgs= undefined;
        return _onClose();
    });
});

