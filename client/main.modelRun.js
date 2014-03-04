// TODO: merge with valuesInput


var T= SpongeTools.Template;

var _getModel= SpongeTools.getCachedData('getModel');
var getModel= function() {
    var modelId= SpongeTools.modelId();
    if ( !modelId ) return;

    return _getModel(modelId);
};

var _getModelArgs= SpongeTools.getCachedData('getModelArgs');
var getModelArgs= function() {
    var modelId= SpongeTools.modelId();
    if ( !modelId ) return;

    return _getModelArgs(modelId);
};

var _runModel= SpongeTools.getCachedData('startJob', 2000);
var runModel= function( args, details ) {
    return _runModel(SpongeTools.modelId(), args, details, function() {
        SpongeTools.invalidateJobList(true);
    });
};

var injectVar= SpongeTools.injectVar;
var injectGlobalVar= SpongeTools.injectGlobalVar;

T.select('modelRunTitle');

T.helper('title', function() {
    var model= getModel();
    if ( model ) return model.name;
});

/**
 * TEMPLATE runModel
 */

T.select('modelRunBody');

T.change('rendered', function() {
    $(this.find('table')).tooltip({
        placement: 'bottom',
        selector: 'a',
        html: true,
    });
});

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
        var value= arg.getValue();

        // skip all undefined optional args
        if ( value === undefined && arg.info.optional ) return;

        result[arg.name]= value;
    });
    return result;
};


var validateArgs= function( args ) {
    if ( !args ) return true;

    for ( var name in args ) {
        if ( typeof args[name] === 'undefined' ) {
            return false;
        }
    }
    return true;
};

T.helper('getArgs', function() {
    var modelArgs= getModelArgs();

    // reset callbacks
    verifyArgs= onClose= undefined;

    if ( !modelArgs ) return;

    var self= this;

    var result= {};

    [ 'args', 'inputs' ].forEach(function( property ) {
        if ( !modelArgs[property] ) return;

        result[property]= SpongeTools.buildValues(modelArgs, property, self);
    });

    verifyArgs= function() {
        var args= parseArgs(result.args);

        return validateArgs(args);// && validateArgs(inputs);
    };

    onClose= function() {
        return runModel({
            args: parseArgs(result.args),
//            input: parseArgs(result.inputs),
        },
        {
            description: getDescription(),
        });
    };

    return result;
});

T.helper('nameClass', function() {
    return this.info && this.info.optional ? 'optional' : 'mandatory';
});

T.helper('infoNotEmpty', function() {
    return this.info && (this.info.unit || this.info.description);
});

T.helper('infoText', function() {
    var result= [];

    if ( this.info.unit ) result.push('[' + this.info.unit + ']');

    if ( this.info.description ) result.push(this.info.description.replace(/\n/g, '<br />'));

    return result.join('<br />');
});

T.events({
    'click a.editValue': function( event ) {
        injectGlobalVar('valueInput')(this);
        SpongeTools.showModal($('#valueInput'));
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

    return true;
};

$(function() {
    $('body').delegate('#modelRun button.btn-primary', 'click', function() {

        if ( !validateForm() ) {
            alert('You have to set all arguments and\nenter a valid title and description for this job!');
            return;
        }

        $('#modelRun').modal('hide');

        if ( onClose ) onClose();
        return false;
    });
});

