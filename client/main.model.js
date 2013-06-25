
var getSchema= DataObjectTools.getCachedData('getSchemaByTypeVersion');

var saveModel= function( model ) {
    console.log(model);
};

var injectVar= DataObjectTools.injectVar;

var objectArrayMapper= function( obj ) {
    return Object.keys(obj).map(function( key ) {
        var value= obj[key];
        if ( typeof value !== 'object' ) {
            value= {
                type: value,
            };
        }
        var result= {
            name: key,
            type: value.type,
        };
        ['unit', 'description'].forEach(function( key ) {
            if ( key in value ) result[key]= value[key];
        });
        return result;
    })
};

Template.model.args= function() {
    return objectArrayMapper((this.definition || {}).args);
};

Template.model.result= function() {
    return objectArrayMapper((this.definition || {}).result);
};

Template.model.functionCode= function() {
    var body= (this.functionBody || {}).code || '';
    var self= this;
    var isEditMode= injectVar(this, 'editFunction');
    var result= {
        getValue: function() { return body; },
    };

    $('html').css('overflow', 'hidden');
    result.setValue= function( newBody ) {
        self.functionBody= {
            bsontype: 'Code',
            code: newBody,
            scope: {},
        };
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

Template.model.isChanged= function() {
    return injectVar(this, 'changed', false);
}

Template.model.bodyEscaped= function() {
    var body= (this.functionBody || {}).code || '';
    return body.replace(/\&/g, '&amp;').replace(/\</g, '&lt;');
}

Template.model.isTemplate= function() {
    return !('templateId' in this);
};

Template.model.timeStamp= function() {
    return DataObjectTools.formatValue(this.timeStamp, true);
}

Template.model.inputDefinitions= function() {
    var inputs= (this.inputDefinitions || {}).typeMap || {};
};

Template.model.events({
    'click pre': function() {
        injectVar(this, 'editFunction')(true);
    },
    'click a.save': function() {
        saveModel(this);
        injectVar(this, 'changed')(false);
    },
});

