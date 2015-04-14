
var _saveModel= {
    'Model': SpongeTools.postData('saveModel'),
    'ModelTemplate': SpongeTools.postData('saveModelTemplate'),
}

var saveModel= function( model ) {
    var type= model.type;

    _saveModel[type](model);
};

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
var valueToString= SpongeTools.valueToString;
var str2Oid= SpongeTools.str2Oid;

var runModelInvalidator= SpongeTools.getInvalidator();
var runModelActive= false;

/*
 * Save arguments from last run of this model to preset arguments in next runModel dialog
 */
var lastRunModelArgs= {};

var T= SpongeTools.Template;

var editorContext= SpongeTools.editorContext(function( context ) {
    injectVar(context, 'changed')(true);
});

T.select('model');

T.helper('nameContext', function() {
    return editorContext(this, 'name');
});

T.helper('id', function() {
    return valueToString(str2Oid(this._id));
});

T.helper('descriptionContext', function() {
    return editorContext(this, 'description');
});

T.helper('args', function() {
    return SpongeTools.editableTypeMap(this.definition, 'args', injectVar(this, 'changed'));
});

T.helper('result', function() {
    return SpongeTools.editableTypeMap(this.definition, 'result', injectVar(this, 'changed'));
});

T.helper('functionCode', function() {
    var body= (this.functionBody || {}).code || '';
    var self= this;
    var isEditMode= injectVar(this, 'editFunction', false);
    var result= {
        getValue: function() { return body; },
    };

    $('html').css('overflow', 'hidden');
    result.setValue= function( newBody ) {
        if ( self.functionBody.code === newBody ) return;

        self.functionBody= new SpongeTools.Types.Code(newBody);
        injectVar(self, 'changed')(true);
    };
    result.hasButtonBar= true;
    result.onClose= function() {
        isEditMode(false);
        $('html').css('overflow', 'auto');
    }

    return result;
});

T.helper('editFunction', function() {
    return injectVar(this, 'editFunction', false)();
});

T.helper('bodyEscaped', function() {
    var body= (this.functionBody || {}).code || '';
    return body.replace(/\&/g, '&amp;').replace(/\</g, '&lt;');
});

T.helper('isTemplate', function() {
    return this.type === 'ModelTemplate';
});

T.helper('timeStamp', function() {
    return SpongeTools.formatValue(this.timeStamp, true);
});

T.helper('owner', function() {
    var acls= SpongeTools.parseAcls(this.acl).permissions;
    return acls.owner && acls.owner.user && acls.owner.user[0];
});

T.helper('inputDefinitions', function() {
    var changedFn= injectVar(this, 'changed');
    var result= _.chain(this.inputDefinitions).pairs().map(function( input ) {
        return _.extend(_.clone(input[1]), { name: input[0], onChange: changedFn, });
    }).value();
    return result;
});

T.helper('inputs', function() {
    var changedFn= injectVar(this, 'changed');
    var inputChangedFn= injectVar(this, 'inputChanged');
    var model= this;
    var inputDefs= (model.definition || {}).inputs || model.inputDefinitions;
    if ( !inputDefs ) return;

    var inputInfo= (model.definition.info || {}).inputs || {};

    if ( !model.inputs ) model.inputs= {};

    var inputs= model.inputs;
    var result= Object.keys(inputDefs).map(function( name ) {
        var inputChangedFn= injectVar(this, 'input.' + name, inputs[name]);
        inputChangedFn();
        var varFn= function( newValue ) {
            if ( arguments.length ) {
                inputs[name]= newValue;
                changedFn(true);
                inputChangedFn(newValue);
            }

            return inputs[name];
        }
        return {
            value: SpongeTools.buildValue(name, inputDefs[name], varFn, null),
            info: inputInfo[name] || {},
        };
    });
    return result;
});

T.events({
    'dblclick pre.javascript': function() {
        injectVar(this, 'editFunction')(true);
    },
    'click button.btn-primary.save': function() {
        saveModel(this);
        injectVar(this, 'changed')(false);
    },
    'click a.modelRun': function() {
        runModelActive= true;
        runModelInvalidator(true);
    },
});

/*
 * empty helper to open model args dialog and start model
 */
T.helper('runModelHelper', function() {
    runModelInvalidator();
    if ( !runModelActive ) return;

    var model= getModel();
    var modelArgs= getModelArgs();

    if ( !model || !modelArgs ) return;

    runModelActive= false;

    var args= SpongeTools.buildValues(modelArgs, 'args', this, SpongeTools.clone(lastRunModelArgs[SpongeTools.oid2Str(model._id)]));

    SpongeTools.valuesInput(
        args, {
            title: model.name,
            simple: false,
            bottomTemplate: Template.modelRunArgsBottom,
            bottomTemplateContext: model,
            validate: function( args ) {
                var desc= getRunModelDescription();
                var result= []
                if ( !desc.title ) result.push('Job title missing');
                if ( !desc.text ) result.push('Description missing');
                return result;
            },
        }, function( args ) {
            lastRunModelArgs[SpongeTools.oid2Str(model._id)]= SpongeTools.clone(args);

            return runModel({
                args: args,
            },
            {
                description: getRunModelDescription(),
            });
        }
    );
});


var getRunModelDescription= function() {
    var $base= $('#valuesInput');
    return {
        title: $base.find('[name="job-title"]').val(),
        text: $base.find('[name="job-description"]').val(),
    };
};

/**
 * TEMPLATE modelChangedRow
 */

T.select('modelChangedRow');

T.helper('isChanged', function() {
    return injectVar(this, 'changed', false)();
});

T.helper('class', function() {
    return injectVar(this, 'changed', false)() ? 'btn-primary' : 'disabled';
});

T.helper('isModel', function() {
    return this.type === 'Model';
});

/**
 * TEMPLATE objectType
 */

T.select('objectType');

T.helper('schema', function() {
    var schema= SpongeTools.findThisSchema(this.args, this.result);
    return schema;
});

T.helper('args', function() {
return;
    return SpongeTools.editableTypeMap(this, 'args', this.onChange);
});

T.helper('result', function() {
return;
    return SpongeTools.editableTypeMap(this, 'result', this.onChange);
});


/**
 * TEMPLATE modelRunArgsBottom
 */

T.select('modelRunArgsBottom');

var pad= function(v) {
    v= String(v);
    if ( v.length < 2 ) v= '0' + v;
    return v;
}

T.helper('defaultJobDescription', function() {
    var now= new Date();
    return 'started at ' + now.getUTCFullYear() + '-' + pad(now.getUTCMonth() + 1) + '-' + pad(now.getUTCDate()) + ' ' + pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds());
});

