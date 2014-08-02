
var T= SpongeTools.Template;

var ReactiveValue= SpongeTools.ReactiveValue;
var invalidator= SpongeTools.getInvalidator();

var getTypeVersions= SpongeTools.getCachedData('getTypeVersions');
var getAllSchemas= SpongeTools.getCachedData('getAllSchemas');

var _getDataObject= SpongeTools.getCachedData('getDataObject');
var getDataObject= function() {
    var id= ((getStepData(1).object || {}).selector || {})._id;

    if ( !id ) return;

    return _getDataObject(id);
};

var _getSchema= SpongeTools.getCachedData('getSchemaByTypeVersion');
var getSchema= function() {
    var object= getDataObject();
    if ( !object ) return;

    return _getSchema({ type: object.objectType, version: object.version });
};


T.select('wizExport');

var data= [];

var defaultData= [
    { // 0
        type: null,
    },
    { // 1
        object: null,
    },
    { // 2
        exportType: null,
    },
    { // 3
        start: {},
    },
    { // 4
        end: {},
    },
    { // 5
        step: {},
    },
    {},
];

var getStepData= function( step ) {
    return (data[step] || {}).data || {};
};

var stepDisabled= function( step ) {
    if ( (step === 4 || step === 5) && getStepData(2).exportType === 'single' ) return true;
    return false;
};

var lastStep= defaultData.length;

var exportInvalidator= SpongeTools.getInvalidator('exportType');

var createContextData= function( step ) {
    if ( !data[step] ) data[step]= { data: defaultData[step] };
    var _data= data[step];

    _data.finished= false;

    var onFinished= [];
    var context= {
        nextStepData: function() {
            var nextStep= step + 1;
            if ( nextStep >= lastStep ) return null;
            var data= createContextData(nextStep);
            context.nextStepData= function() { return data; };
            return data;
        },
        getContentTemplate: function() { return 'wizExportStep' + (step + 1) + 'Expand'; },
        getContentCompressedTemplate: function() { return 'wizExportStep' + (step + 1) + 'Compressed'; },
        getData: function() { return _data.data },
        isEnabled: function() {
            if ( step === 4 || step === 5 ) {
                exportInvalidator();
                return getStepData(2).exportType !== 'single';
            };
            return true;
        },
        isFinished: function() { return _data.finished; },
        onFinished: function( fn ) {
            if ( typeof fn === 'function' ) onFinished.push(fn);
        },
        finish: function() {
            _data.finished= true;
            for ( var i in onFinished ) {
                onFinished[i]();
            };
        },
        hasNext: function() { return step < lastStep; },
    };
    return context;
};

T.helper('wizardData', function() {
    invalidator();
    data= [];

    var context= {
        firstStepData: function() {
            var data= createContextData(0);
            context.fistStepData= function() { return data; };
            return data;
        }
    };
    return context;
});


T.select('wizExportStep1Expand');

T.helper('loading', function() {
    return !getTypeVersions() || false;
});

T.helper('objectTypes', function() {
    var typeVersions= getTypeVersions();

    if ( !typeVersions ) return;

    return Object.keys(typeVersions).map(function( type ) { return { type: type }; });
});

T.events({
    'change select': function( event ) {
        this.wizardData.getData().type= $(event.currentTarget).val();
        this.wizardData.finish();
    },
});

T.select('wizExportStep2Expand');

T.helper('valueInput', function() {
    var self= this;
    var type= getStepData(0).type;
    var setValue= function( value ) {
        self.wizardData.getData().object= value;
        self.wizardData.finish();
    };
    SpongeTools.valueInput.singleValue({
        get: function() {
            return self.wizardData.getData().object;
        },
        set: setValue,
        setTemp: setValue,
        type: type,
        description: 'The DataObject to export',
        getCompatibleTypes: function() {
            var schemas= getAllSchemas();

            if ( !schemas ) return;

            var curSchemas= schemas.filter(function( schema ) {
                return schema.objectType === type;
            });
            return { schemas: curSchemas, models: [] };
        },
    });
    SpongeTools.valueInput.buildContextForModel();
    Template.valueInputModel.init();
    return Template.valueInputModel;
});

T.select('wizExportStep2Compressed');

T.helper('objectName', function() {
    return SpongeTools.valueToString(this.wizardData.getData().object);
});

T.select('wizExportStep3Expand');

T.events({
    'click input': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().exportType= value;
        this.wizardData.finish();
    },
});

T.select('wizExportStep3Compressed');

T.helper('isSingle', function() {
    return this.wizardData.getData().exportType === 'single';
});
T.helper('isSequence', function() {
    return this.wizardData.getData().exportType === 'sequence';
});
T.helper('isRaw', function() {
    return this.wizardData.getData().exportType === 'raw';
});





var _getValues= function( property ) {
    return function() {
        var schema= getSchema();
        if ( !schema ) return;

        var args= schema.definition.args;
        var info= (schema.definition.info || {}).args;

        var value= this.wizardData.getData()[property];
        return Object.keys(args).map(function( name ) {
            if ( !name in value ) value[name]= undefined;
            return {
                valueName: name,
                value: SpongeTools.valueToString(value[name]),
            };
        });
    };
};

var _editValues= function( property, invalidator ) {
    return function( event ) {
        var schema= getSchema();
        if ( !schema ) return;

        var self= this;
        var args= SpongeTools.buildValues(schema.definition, 'args', this, SpongeTools.clone(this.wizardData.getData()[property]));

        SpongeTools.valuesInput(
            args, {
                title: 'Iterator',
                simple: true,
                bottomTemplate: null,
                bottomTemplateContext: null,
            }, function( args ) {
                self.wizardData.getData()[property]= SpongeTools.clone(args);
                invalidator(true);
                self.wizardData.finish();
            }
        );
    };
};

var startIterator= {
    invalidator: SpongeTools.getInvalidator('start-value'),
    getValues: _getValues('start')
};

T.select('wizExportStep4Expand');

T.helper('title', function() {
    if ( getStepData(2).exportType === 'single' ) return 'Iterator';
    return 'Iterator start';
});

T.helper('iteratorValues', function() {
    startIterator.invalidator();
    return startIterator.getValues.apply(this);
});

T.events({
    'click a.start-value': _editValues('start', startIterator.invalidator),
});

T.select('wizExportStep4Compressed');

T.helper('title', function() {
    if ( getStepData(2).exportType === 'single' ) return 'Iterator';
    return 'Iterator start';
});

T.helper('iteratorValues', function() {
    startIterator.invalidator();
    return startIterator.getValues.apply(this);
});

var endIterator= {
    invalidator: SpongeTools.getInvalidator('end-value'),
    getValues: _getValues('end')
};

T.select('wizExportStep5Expand');

T.helper('iteratorValues', function() {
    endIterator.invalidator();
    return endIterator.getValues.apply(this);
});

T.events({
    'click a.end-value': _editValues('end', endIterator.invalidator),
});

T.select('wizExportStep5Compressed');

T.helper('iteratorValues', function() {
    endIterator.invalidator();
    return endIterator.getValues.apply(this);
});

var stepIterator= {
    invalidator: SpongeTools.getInvalidator('step-value'),
    getValues: _getValues('step')
};

T.select('wizExportStep6Expand');

T.helper('iteratorValues', function() {
    stepIterator.invalidator();
    return stepIterator.getValues.apply(this);
});

T.events({
    'click a.step-value': _editValues('step', stepIterator.invalidator),
});

T.select('wizExportStep6Compressed');

T.helper('iteratorValues', function() {
    stepIterator.invalidator();
    return stepIterator.getValues.apply(this);
});

