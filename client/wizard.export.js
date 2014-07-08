
var T= SpongeTools.Template;

var ReaktiveValue= SpongeTools.ReactiveValue;
var invalidator= SpongeTools.getInvalidator();

T.select('wizExport');

var data= [];

var defaultData= [
    {
        objectTypes: function() { return [ { type: 'zuppi' }, { type: 'zappi' }, ]; },
        type: null,
    },
];

var lastStep= 5;

var createContextData= function( step ) {
    if ( !data[step] ) data[step]= { data: defaultData[step] };
    var onFinsihed= [];
    var context= {
        nextStepData: function() {
            if ( step >= lastStep ) return null;
            var data= createContextData(step + 1);
            context.nextStepData= function() { return data; };
            return data;
        },
        getContentTemplate: function() { return 'wizExportStep' + step + 'Expand'; },
        getContentCompressedTemplate: function() { return 'wizExportStep' + step + 'Compressed'; },
        getData: function() { return data[step].data },
        isFinshed: function() { return data[step].isFinished; },
        onFinished: function( fn ) {
            if ( fn ) onFinsihed.push(fn);
            return onFinished;
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

