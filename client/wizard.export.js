
var T= SpongeTools.Template;

var ReactiveValue= SpongeTools.ReactiveValue;
var invalidator= SpongeTools.getInvalidator();

var getTypeVersions= SpongeTools.getCachedData('getTypeVersions');
var getAllSchemas= SpongeTools.getCachedData('getAllSchemas');

T.select('wizExport');

var data= [];

var defaultData= [
    {
        type: null,
    },
    {
        object: null,
    },
    {
        exportType: null,
    },
];

var lastStep= 5;

var createContextData= function( step ) {
    if ( !data[step] ) data[step]= { data: defaultData[step] };
    var _data= data[step];

    _data.finished= false;

    var onFinished= [];
    var context= {
        nextStepData: function() {
            if ( step >= lastStep ) return null;
            var data= createContextData(step + 1);
            context.nextStepData= function() { return data; };
            return data;
        },
        getContentTemplate: function() { return 'wizExportStep' + (step + 1) + 'Expand'; },
        getContentCompressedTemplate: function() { return 'wizExportStep' + (step + 1) + 'Compressed'; },
        getData: function() { return _data.data },
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
    var type= data[0].data.type;
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

