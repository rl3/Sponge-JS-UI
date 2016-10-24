
var T= SpongeTools.Template;

var ReactiveValue= SpongeTools.ReactiveValue;
var invalidator= SpongeTools.getInvalidator();

var getTypeVersions= SpongeTools.getCachedData('getTypeVersions');
var getAllSchemas= SpongeTools.getCachedData('getAllSchemas');

var _getDataObject= SpongeTools.getCachedData('getDataObject');
var getDataObject= function() {
    var id= ((exportWizardData.object || {}).selector || {})._id;

    if ( !id ) return;

    return _getDataObject(id);
};

var _getSchema= SpongeTools.getCachedData('getSchemaByTypeVersion');
var getSchema= function() {
    if ( exportWizardData.selectorType === 'object' ) {
        var object= getDataObject();
        if ( !object ) return;

        return _getSchema({ type: object.objectType, version: object.version });
    }

    var type= exportWizardData.type;
    var typeVersions= getTypeVersions();
    if ( !typeVersions || !typeVersions[type] ) return;

    return _getSchema({ type: type, version: typeVersions[type][0] });
};

var getTags= SpongeTools.getCachedData('getTagsByTypeVersion');
var getMapnames= SpongeTools.getCachedData('getMapnamesByTypeVersion');

var _getRawDataValues= SpongeTools.getCachedData('exportRawByDataObjId');
var _getSingleDataValue= SpongeTools.getCachedData('exportSingleByDataObjId');
var _getDataValues= SpongeTools.getCachedData('exportByDataObjId');
var _getNearestDataValues= SpongeTools.getCachedData('exportByTagTypeLocation');
var _getMapDataValues= SpongeTools.getCachedData('exportByMapTypeLocation');

T.select('wizExport');

var exportWizardData= {};

var steps= {
    objectType: {
        templatePrefix: 'wizExportObjectType',
        isValid: function() { return exportWizardData.type; },
        getNextStepName: function() { return 'selectorType'; },
//        getNextStepName: function() { return 'object'; },
    },
    selectorType: {
        templatePrefix: 'wizExportSelectorType',
        isValid: function() { return exportWizardData.selectorType; },
        getNextStepName: function() {
            switch ( exportWizardData.selectorType ) {
                case 'object':  return 'object';
                case 'nearest': return 'nearest';
                case 'map':     return 'map';
            }
        },
    },
    object: {
        templatePrefix: 'wizExportObject',
        isValid: function() { return exportWizardData.object; },
        getNextStepName: function() { return 'exportType' },
    },
    nearest: {
        templatePrefix: 'wizExportNearest',
        isValid: function() { return exportWizardData.tag; },
        getNextStepName: function() { return 'location' },
    },
    map: {
        templatePrefix: 'wizExportMap',
        isValid: function() { return exportWizardData.map; },
        getNextStepName: function() { return 'location' },
    },
    location: {
        templatePrefix: 'wizExportLocation',
        isValid: function() { return exportWizardData.location; },
        getNextStepName: function() { return 'exportType' },
    },
    exportType: {
        templatePrefix: 'wizExportExportType',
        isValid: function() { return exportWizardData.exportType && ( exportWizardData.exportType !== 'raw' || exportWizardData.selectorType === 'object' ); },
        getNextStepName: function() { return 'start' },
    },
    start: {
        templatePrefix: 'wizExportStart',
        isValid: function() { return exportWizardData.start || exportWizardData.exportType === 'raw'; },
        getNextStepName: function() { 
        return exportWizardData.exportType === 'single' || (exportWizardData.exportType === 'raw' && !exportWizardData.start) ? 'format' : 'end'; },
    },
    end: {
        templatePrefix: 'wizExportEnd',
        isValid: function() { return exportWizardData.end || exportWizardData.exportType === 'raw'; },
        getNextStepName: function() { return exportWizardData.exportType === 'raw' ? 'format' : 'step'; },
    },
    step: {
        templatePrefix: 'wizExportStep',
        isValid: function() { return exportWizardData.step; },
        getNextStepName: function() { return 'format'; },
    },
    format: {
        templatePrefix: 'wizExportFormat',
        isValid: function() { return exportWizardData.format && ( exportWizardData.format !== 'zalfClimate' || exportWizardData.type === 'climate' ) && ( exportWizardData.format !== 'zalfSoil' || exportWizardData.type === 'soil' ); },
        getNextStepName: function() { return 'submit'; },
    },
    submit: {
        templatePrefix: 'wizExportSubmit',
        isValid: function() { return false; },
        getNextStepName: function() {},
    },
};

var exportInvalidator= SpongeTools.getInvalidator('exportType');

var createContextData= function( stepName ) {
    var finished= false;

    var stepData= steps[stepName];
    if ( !stepData ) return {};

    var onFinished= [];
    var context= {
        name: stepName,
        nextStepData: function() {
            var nextStepName= stepData.getNextStepName();
            return createContextData(nextStepName);
        },
        getContentTemplate: function() { return stepData.templatePrefix + 'Expand'; },
        getContentCompressedTemplate: function() { return stepData.templatePrefix + 'Compressed'; },
        getData: function() { return exportWizardData; },
        isFinished: function() { return finished; },
        onFinished: function( fn ) {
            if ( typeof fn === 'function' ) onFinished.push(fn);
        },
        nextAllowed: function() {
            return stepData.isValid();
        },
        finish: function() {
            finished= true;
            for ( var i in onFinished ) {
                onFinished[i]();
            };
        },
        hasNext: function() { return stepData.getNextStepName(); },
    };
    return context;
};

T.helper('wizardData', function() {
    invalidator();

    var data= createContextData('objectType');

    var context= {
        firstStepData: function() { return data; },
    };
    return context;
});


T.select('wizExportObjectTypeExpand');

T.helper('loading', function() {
    return !getTypeVersions() || false;
});

T.helper('objectTypes', function() {
    var typeVersions= getTypeVersions();

    if ( !typeVersions ) return;

    var types= Object.keys(typeVersions);

    types.sort();

    return types;
});

T.helper('selected', function() {
    return this === exportWizardData.type;
});

T.events({
    'change select': function( event ) {
        this.wizardData.getData().type= $(event.currentTarget).val();
        this.wizardData.finish();
    },
});


T.select('wizExportSelectorTypeExpand');

T.helper('checked', function( value ) {
    return this.wizardData.getData().selectorType === value;
});

T.events({
    'click input': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().selectorType= value;
        this.wizardData.finish();
    },
});

T.select('wizExportSelectorTypeCompressed');

T.helper('is', function( type ) {
    return this.wizardData.getData().selectorType === type;
});


T.select('wizExportObjectExpand');

T.helper('valueInput', function() {
    var self= this;
    var type= exportWizardData.type;
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

T.select('wizExportObjectCompressed');

T.helper('objectName', function() {
    return SpongeTools.valueToString(this.wizardData.getData().object);
});


T.select('wizExportNearestExpand');

var _getTags= function() {

    var typeVersions= getTypeVersions();

    if ( !typeVersions ) return;

    var type= exportWizardData.type;

    var tags= getTags(type, typeVersions[type]);

    if ( !tags ) return;
    if ( tags.length === 0 ) return tags;

    tags.sort();
    return tags;
};

T.helper('loading', function( value ) {
    return !_getTags();
});

T.helper('tag', function() {
    return _getTags();
});

T.helper('selectedTag', function() {
    return this.toString() === exportWizardData.tag;
});


T.events({
    'change select': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().tag= value;
        this.wizardData.finish();
    },
});


T.select('wizExportMapExpand');

var _getMaps= function() {

    var typeVersions= getTypeVersions();

    if ( !typeVersions ) return;

    var type= exportWizardData.type;

    var maps= getMapnames(type, typeVersions[type]);

    if ( !maps ) return;
    if ( maps.length === 0 ) return maps;

    maps.sort(function( a, b ) { return a.name.localeCompare(b.name); });
    return maps.map(function( map ) { return new SpongeTools.TypeMap(map) });
};

T.helper('loading', function( value ) {
    return !_getMaps();
});

T.helper('map', function() {
    return _getMaps();
});

T.helper('selectedMap', function() {
    return this.mapId.toString() === (exportWizardData.map || {}).mapId;
});


T.events({
    'change select': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().map= new SpongeTools.TypeMap({ _id: value });
        this.wizardData.finish();
    },
});


T.select('wizExportMapCompressed');

T.helper('mapName', function() {
    return SpongeTools.valueToString(this.wizardData.getData().map);
});


T.select('wizExportLocationExpand');

T.helper('locationInput', function() {
    var setValue= function( value ) {
        this.wizardData.getData().location= value;
        this.wizardData.finish();
    }.bind(this);

    SpongeTools.valueInput.singleValue({
        get: function() {
            return this.wizardData.getData().location;
        }.bind(this),
        set: setValue,
        setTemp: setValue,
        type: 'Location',
        description: 'Location to find object near by',
    });
    return Template.valueInputLocation;
});

T.select('wizExportLocationCompressed');

T.helper('location', function( type ) {
    return SpongeTools.valueToString(this.wizardData.getData().location);
});


T.select('wizExportExportTypeExpand');

T.helper('checked', function( value ) {
    return this.wizardData.getData().exportType === value;
});
T.helper('single',   function() { return 'single'   });
T.helper('sequence', function() { return 'sequence' });
T.helper('raw',      function() { return 'raw'      });
T.helper('rawEnabled', function() { return this.wizardData.getData().selectorType === 'object'});

T.events({
    'click input': function( event ) {
        var value= $(event.currentTarget).val();
        exportInvalidator(true);
        this.wizardData.getData().exportType= value;
        this.wizardData.finish();
    },
});

T.select('wizExportExportTypeCompressed');

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
        if ( !value ) value= {};

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

T.select('wizExportStartExpand');

T.helper('title', function() {
    if ( exportWizardData.exportType === 'single' ) return 'Iterator';
    return 'Iterator start';
});

T.helper('iteratorValues', function() {
    startIterator.invalidator();
    return startIterator.getValues.apply(this);
});

T.events({
    'click a.start-value': _editValues('start', startIterator.invalidator),
});

T.select('wizExportStartCompressed');

T.helper('title', function() {
    if ( exportWizardData.exportType === 'single' ) return 'Iterator';
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

T.select('wizExportEndExpand');

T.helper('iteratorValues', function() {
    endIterator.invalidator();
    var _ei= endIterator.getValues.apply(this);
    return endIterator.getValues.apply(this);
});

T.events({
    'click a.end-value': _editValues('end', endIterator.invalidator),
});

T.select('wizExportEndCompressed');

T.helper('iteratorValues', function() {
    endIterator.invalidator();
    return endIterator.getValues.apply(this);
});

var stepIterator= {
    invalidator: SpongeTools.getInvalidator('step-value'),
    getValues: _getValues('step')
};

T.select('wizExportStepExpand');

T.helper('iteratorValues', function() {
    stepIterator.invalidator();
    return stepIterator.getValues.apply(this);
});

T.events({
    'click a.step-value': _editValues('step', stepIterator.invalidator, true),
});

T.select('wizExportStepCompressed');

T.helper('iteratorValues', function() {
    stepIterator.invalidator();
    return stepIterator.getValues.apply(this);
});

T.select('wizExportFormatExpand');

T.helper('checked', function( value ) {
    return this.wizardData.getData().format === value;
});
T.helper('zalfClimateEnabled', function() { return this.wizardData.getData().type === 'climate'; });
T.helper('zalfSoilEnabled', function() { return this.wizardData.getData().type === 'soil'; });

T.events({
    'click input': function( event ) {
        var value= $(event.currentTarget).val();
        //console.log('click', event.currentTarget, value)
        exportInvalidator(true);
        this.wizardData.getData().format= value;
        this.wizardData.finish();
    },
});

T.select('wizExportFormatCompressed');

T.helper('is', function( type ) {
    return this.wizardData.getData().format === type;
});

T.select('wizExportSubmitExpand');

var step7Loading= ReactiveValue(false);
T.helper('loading', function() {
    return step7Loading();
});

T.events({
    'click button': function( event ) {
        var exportType= exportWizardData.exportType;
        var format= exportWizardData.format;

        var fn, args;

        step7Loading(true);

        switch ( exportType ) {
            case 'single':
                fn= _getSingleDataValue;
                args= [ exportWizardData.start, null, null, format ];
                break;
            case 'sequence':
                fn= _getDataValues;
                args= [ exportWizardData.start, exportWizardData.end, exportWizardData.step, format ];
                break;
            case 'raw':
                fn= _getRawDataValues;
                args= [ exportWizardData.start, exportWizardData.end, format ];
                break;
        }

        switch ( exportWizardData.selectorType ) {
            case 'object':
                args.unshift(exportWizardData.object.selector._id);
                break;
            case 'nearest':
                fn= _getNearestDataValues;
                args.unshift(exportWizardData.location[1]);
                args.unshift(exportWizardData.location[0]);
                args.unshift(exportWizardData.type);
                args.unshift(exportWizardData.tag);
                break;
            case 'map':
                fn= _getMapDataValues;
                args.unshift(exportWizardData.location[1]);
                args.unshift(exportWizardData.location[0]);
                args.unshift(exportWizardData.type);
                args.unshift((exportWizardData.map || {}).mapId);
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
                case 'zalfClimate': contentType= 'application/zip'; target= '_new'; break;
                case 'zalfSoil': contentType= 'application/json'; target= '_new'; break;
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
    },
});

