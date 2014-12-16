
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


var _getRawDataValues= SpongeTools.getCachedData('exportRawByDataObjId');
var _getSingleDataValue= SpongeTools.getCachedData('exportSingleByDataObjId');
var _getDataValues= SpongeTools.getCachedData('exportByDataObjId');

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

var nextFns= [
    // 0 - ObjectType
    function( data ) { return data.type },
    // 1 - DataObject
    function( data ) { return data.object },
    // 2 - export type
    function( data ) { return data.exportType },
    // 3 - start/single
    function( data ) { return Object.keys(data.start).length || getStepData(2).exportType === 'raw' },
    // 4 - end
    function( data ) { return Object.keys(data.end).length },
    // 5 - step
    function( data ) { return Object.keys(data.step).length },
    // 6 - submit
    function( data ) { return false },
];

var getStepData= function( step ) {
    return (data[step] || {}).data || {};
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
            if ( step === 4 ) {
                exportInvalidator();
                var exportType= getStepData(2).exportType
                if ( exportType === 'raw' && Object.keys(getStepData(3).start).length === 0 ) return false;
                return exportType !== 'single';
            };
            if ( step === 5 ) {
                exportInvalidator();
                return getStepData(2).exportType === 'sequence';
            };
            return true;
        },
        isFinished: function() { return _data.finished; },
        onFinished: function( fn ) {
            if ( typeof fn === 'function' ) onFinished.push(fn);
        },
        nextAllowed: function() {
            return nextFns[step](_data.data);
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

T.helper('selected', function() {
    return this.type === getStepData(0).type;
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

T.helper('checked', function( value ) {
    return this.wizardData.getData().exportType === value;
});
T.helper('single',   function() { return 'single'   });
T.helper('sequence', function() { return 'sequence' });
T.helper('raw',      function() { return 'raw'      });

T.events({
    'click input': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().exportType= value;
        this.wizardData.finish();
    },
});

T.select('wizExportStep3Compressed');

T.helper('is', function( type ) {
    return this.wizardData.getData().exportType === type;
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

var _editValues= function( property, invalidator, forStep ) {
    return function( event ) {
        var schema= getSchema();
        if ( !schema ) return;

        var self= this;

        var args= {};
        var info= {};
        if ( schema.definition.args ) {
            for ( var name in schema.definition.args ) {
                args[name]= schema.definition.args[name];
                info[name]= schema.definition.info.args[name] ? _.clone(schema.definition.info.args[name]) : {};
                info[name].optional= !forStep;

                if ( !forStep || args[name] !== 'Date' ) continue;

                args[name]= 'Const';
                info[name].const= ['second', 'minute', 'hour', 'day', 'month', 'year'];
            }
        }

        var _args= SpongeTools.buildValues({ args: args, info: { args: info }}, 'args', this, SpongeTools.clone(this.wizardData.getData()[property]));

        SpongeTools.valuesInput(
            _args, {
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
    var _ei= endIterator.getValues.apply(this);
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
    'click a.step-value': _editValues('step', stepIterator.invalidator, true),
});

T.select('wizExportStep6Compressed');

T.helper('iteratorValues', function() {
    stepIterator.invalidator();
    return stepIterator.getValues.apply(this);
});

T.select('wizExportStep7Expand');


var step7Loading= ReactiveValue(false);
T.helper('loading', function() {
    return step7Loading();
})

var clickEventGen= function( format ) {
    return function( event ) {
        var exportType= getStepData(2).exportType;
        var fn, args;

        step7Loading(true);

        switch ( exportType ) {
            case 'single':
                fn= _getSingleDataValue;
                args= [ getStepData(1).object.selector._id, getStepData(3).start, format ];
                break;
            case 'sequence':
                fn= _getDataValues;
                args= [ getStepData(1).object.selector._id, getStepData(3).start, getStepData(4).end, getStepData(5).step, format ];
                break;
            case 'raw':
                fn= _getRawDataValues;
                args= [ getStepData(1).object.selector._id, getStepData(3).start, getStepData(4).end, format ];
                break;
        }

        var jobId= 'export-' + format + ':' + JSON.stringify(EJSON.toJSONValue(args));

        SpongeTools.lazyHelper.addJob(jobId, function() {

            var result= fn.apply(null, args);

            // while no data keep lazy job
            if ( !result ) {
                if ( result === null ) {
                    step7Loading(false);
                    return false;
                }
                return true;
            }

            // if no url, remove lazyJob
            if ( !result.url ) return false;

            var url= SpongeTools.buildApiUrl(result.url);

            var contentType, target;
            switch ( format ) {
                case 'csv': contentType= 'text/comma-separated-values'; break;
                case 'xml': contentType= 'text/xml'; target= '_new'; break;
                case 'xlsx': contentType= 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; target= '_new'; break;
                default: contentType= 'application/vnd.google-earth.kml+xml'; break;
            }

            SpongeTools.downloadLink(url, {
                query: {
                    contentType: contentType,
                    fileName: 'result.' + format,
                },
            });

            step7Loading(false);

            // remove lazyJob
            return false;
        });

        return true;
    }
};

T.events({
    'click button.export-xml': clickEventGen('xml'),
    'click button.export-xlsx': clickEventGen('xlsx'),
});

