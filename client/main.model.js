
var _saveModel= {
    'Model': SpongeTools.postData('saveModel'),
    'ModelTemplate': SpongeTools.postData('saveModelTemplate'),
}

var saveModel= function( model ) {
    var type= model.type;

    _saveModel[type](model);
};

var injectVar= SpongeTools.injectVar;
var valueToString= SpongeTools.valueToString;
var str2Oid= SpongeTools.str2Oid;

var T= SpongeTools.Template;

var editor= SpongeTools.editor(function( context ) {
    injectVar(context, 'changed')(true);
});

T.select('model');

T.helper('name', function() {
    return editor(this, 'name');
});

T.helper('id', function() {
    return valueToString(str2Oid(this._id));
});

T.helper('description', function() {
    return editor(this, 'description');
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
    var inputDefs= model.inputDefinitions;

    if ( !inputDefs ) return;

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
        return SpongeTools.buildValue(name, inputDefs[name], varFn, null);
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
        SpongeTools.showModal($('#modelRun'));
    },
});

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


