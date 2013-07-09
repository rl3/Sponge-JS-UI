
var _saveModel= {
    'Model': DataObjectTools.postData('saveModel'),
    'ModelTemplate': DataObjectTools.postData('saveModelTemplate'),
}

var saveModel= function( model ) {
    var type= model.type;

    _saveModel[type](model);
};

var injectVar= DataObjectTools.injectVar;

var objectArrayMapper= function( context, prop, changedVar ) {
    if ( !context ) context= {};
    if ( !changedVar ) changedVar= function() {};
    var obj= context[prop];
    var info= (context.info || {})[prop];

    var infoFields= [ 'unit', 'description' ];

    return Object.keys(obj).map(function( key ) {
        return new GuiTools.Edit({
            get: function() {
                var type= obj[key];
                var valueInfo= (info || {})[key] || {};

                if ( valueInfo.unit === 'none' ) delete valueInfo.unit;
                return _.extend({
                    name: key,
                    type: type,
                    sparse: !info,
                }, valueInfo);
            },
            set: function( newValue ) {
                var oldValue= obj[key];
                var newName= newValue.name;
                changedVar(true);

                if ( newName !== key ) {
                    if ( !newName || newName in obj ) {
                        delete obj[key];
                        if ( info[key] ) delete info[key];
                        return;
                    }
                    obj[newName]= obj[key];
                    delete obj[key];
                    if ( key in info ) {
                        info[newName]= info[key];
                        delete info[key];
                    }
                    key= newName;
                }

                obj[key]= newValue.type;
                if ( !info ) {
                    if ( !context.info ) context.info= {};
                    context.info[prop]= info= {};
                }
                info[key]= _.chain(newValue).omit('type', 'name', 'sparse').pairs().
                    filter(function( value ) { return value[1] !== undefined; }).object().value();
            },
            viewTemplateName: 'editViewType',
            editTemplateName: 'editEditType',
            asTr: true,
        });


    })
};

var editor= function( context, property ) {
    return new GuiTools.Edit({
        get: function() { return context[property]; },
        set: function( newValue ) {
            context[property]= newValue;
            injectVar(context, 'changed')(true);
        },
    });
}

Template.model.Name= function() {
    return editor(this, 'name');
}

Template.model.Description= function() {
    return editor(this, 'description');
}

Template.model.args= function() {
    return objectArrayMapper(this.definition, 'args', injectVar(this, 'changed'));
};

Template.model.result= function() {
    return objectArrayMapper(this.definition, 'result', injectVar(this, 'changed'));
};

Template.model.functionCode= function() {
    var body= (this.functionBody || {}).code || '';
    var self= this;
    var isEditMode= injectVar(this, 'editFunction', false);
    var result= {
        getValue: function() { return body; },
    };

    $('html').css('overflow', 'hidden');
    result.setValue= function( newBody ) {
        if ( self.functionBody.code === newBody ) return;

        self.functionBody= new DataObjectTools.Types.Code(newBody);
        injectVar(self, 'changed')(true);
    };
    result.hasButtonBar= true;
    result.onClose= function() {
        isEditMode(false);
        $('html').css('overflow', 'auto');
    }

    return result;
};

Template.model.editFunction= function() {
    return injectVar(this, 'editFunction', false)();
}

Template.model.bodyEscaped= function() {
    var body= (this.functionBody || {}).code || '';
    return body.replace(/\&/g, '&amp;').replace(/\</g, '&lt;');
}

Template.model.isTemplate= function() {
    return this.type === 'ModelTemplate';
};

Template.model.timeStamp= function() {
    return DataObjectTools.formatValue(this.timeStamp, true);
}

Template.model.inputDefinitions= function() {
    var changedFn= injectVar(this, 'changed');
    var result= _.chain(this.inputDefinitions).pairs().map(function( input ) {
        return _.extend(_.clone(input[1]), { name: input[0], onChange: changedFn, });
    }).value();
    return result;
};

Template.model.events({
    'dblclick pre.javascript': function() {
        injectVar(this, 'editFunction')(true);
    },
    'click button.btn-primary.save': function() {
        saveModel(this);
        injectVar(this, 'changed')(false);
    },
});

/**
 * TEMPLATE modelChangedRow
 */

Template.modelChangedRow.isChanged= function() {
    return injectVar(this, 'changed', false)();
}

Template.modelChangedRow.class= function() {
    return injectVar(this, 'changed', false)() ? 'btn-primary' : 'disabled';
}

/**
 * TEMPLATE modelInputDefinition
 */

Template.modelInputDefinition.schema= function() {
    var schema= DataObjectTools.findThisSchema(this.args, this.result);
    return schema;
};

Template.modelInputDefinition.args= function() {
    return objectArrayMapper(this, 'args', this.onChange);
};

Template.modelInputDefinition.result= function() {
    return objectArrayMapper(this, 'result', this.onChange);
};

