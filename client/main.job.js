
var ItemsPerPage= 50;
var jobUpdateTimeout= 10000; // 10s

var injectVar= SpongeTools.injectVar;

var jobId= SpongeTools.jobId;

var invalidateJob= SpongeTools.invalidateJob;

var editor= SpongeTools.editor(function( context ) {
    injectVar(context, 'changed')(true);
});

var _getJob= SpongeTools.getCachedData('getJob', 2000);
var getJob= function( _jobId ) {
    if ( !_jobId ) _jobId= jobId();
    invalidateJob(_jobId);
    return _getJob(_jobId);
};

// var getJobLog= SpongeTools.getCachedData('getJobLog', 2000);
var getJobLog= SpongeTools.postData('getJobLog');
var deleteJobLog= SpongeTools.postData('deleteJobLog');

var getJobResult= SpongeTools.getCachedData('getJobResult', 2000);

var _restartJob= SpongeTools.getCachedData('restartJob', 2000);
var restartJob= function() {
    _restartJob(jobId(), function() {
        SpongeTools.invalidateJobList(true);
        invalidateJob(jobId(), true);
    });
};

var _removeJob= SpongeTools.getCachedData('removeJob', 2000);
var removeJob= function() {
    var _jobId= jobId();
    _removeJob(_jobId, function() {
        SpongeTools.invalidateJobList(true);
        invalidateJob(_jobId, true);
    });
    jobId(undefined);
};

var _getModel= SpongeTools.getCachedData('getModel');
var getModel= function() {
    var job= getJob();
    if ( !job ) return;

    return SpongeTools.cleanObject(_getModel(job.modelId));
};

var T= SpongeTools.Template;

/**
 * Template job
 */
T.select('job');

T.helper('statusClass', function() {
    if ( this.status.error )     return 'error';
    if ( this.status.success )   return 'success';
    if ( !this.status.finished ) return 'running';
    return '';
});

T.helper('status', function() {
    if ( this.status.error )     return new Handlebars.SafeString('Error:<br /><code>' + this.status.error + '</code>');
    if ( this.status.success )   return 'Successfully finished';
    if ( !this.status.finished ) return 'Running';
    return '';
});

T.helper('startTime', function() {
    return this.status.started.toLocaleString();
});

T.helper('finishTime', function() {
    return this.status.finished && this.status.finished.toLocaleString();
});

T.helper('model', function() {
    var model= getModel();
    if ( !model ) return SpongeTools.valueToString(SpongeTools.modelId());

    return model.name;
});

T.helper('descriptionTitle', function() {
    return editor(this.description, 'title');
});

T.helper('descriptionText', function() {
    return editor(this.description, 'text');
});

T.helper('args', function() {
    if ( !this.inArgs || !this.inArgs.args ) return;

    var args= this.inArgs.args;
    return Object.keys(args).map(function( argName ) {
        return {
            name: argName,
            value: new Handlebars.SafeString(SpongeTools.valueToString(args[argName], { locationFn: true, })),
        };
    });
});

var showArgs= injectVar({}, 'showHide', false);

T.helper('showHideArgsText', function() {
    return new Handlebars.SafeString('<i class="' + (showArgs() ? 'icon-chevron-down' : 'icon-chevron-right') + '"></i>');
});

T.helper('showArgs', function() {
    return showArgs();
});

var setLogResult= function( content ) {
    $('#jobLog pre').html(content);
};

T.events({
    'click button.show-log': function( event ) {
        setLogResult('');
        SpongeTools.showModal($('#jobLog'));

        var jobId= SpongeTools.jobId();
        if ( !jobId ) return;

        var log= getJobLog(jobId, function(err, result) {
            if ( err ) console.error(err);
            setLogResult((result || {}).content);
        });

    },
    'click button.delete-log': function( event ) {
        var jobId= SpongeTools.jobId();
        if ( !jobId ) return;

        var log= deleteJobLog(jobId, function(err, result) {});

    },
    'click button.rerun-job': restartJob,
    'click button.delete-job': removeJob,
    'click a.show-hide-args': function( event ) {
        showArgs(!showArgs());
    },
    'click a.location': function( event ) {
        var $a= $(event.currentTarget);
        var lat= +$a.attr('lat');
        var lon= +$a.attr('lon');
        SpongeTools.showMap();
        SpongeTools.addMapMarker(lon, lat, { infotext: '<div><div><b>Job-Titel</b></div><div>Hier kommt die Job-Beschreibung hin.</div></div>' });
    },
});


T.select('jobResult');

// FIXME: build simple result structure
var _getResultLevel= function( results, path ) {
    for ( var key in results ) {
        var result= results[key];

        if ( typeof result !== 'object' ) continue;

        var newPath= path ? ( path + '.' + key ) : key;

        if ( 'tables' in result ) return { result: result, path: newPath };

        var r= _getResultLevel(result, newPath);
        if ( r ) return r;
    }
};

var getResult= function() {
    var jobId= SpongeTools.jobId();
    if ( !jobId ) return;

    return _getResultLevel(getJobResult({ jobId: jobId, path: '', }));
};

T.helper('result', getResult);

T.helper('resultMap', function() {
    var result= this.result || {};

    return Object.keys(result).filter(function( key ) {
        return key !== 'tables';
    }).map(function( key ) {
        var value= SpongeTools.valueToString(
            result[key],
            {
                returnOnObject: null,
                returnOnArray: null,
                locationFn: true,
            }
        );
        if ( ! value ) return;

        return {
            resultName: key,
            resultValue: new Handlebars.SafeString(value),
        }
    }).filter(function( result ) {
        return result;
    });
});

T.helper('resultTables', function() {
    var tables= (this.result || {}).tables;
    var path= this.path;

    if (! tables ) return;

    var result= [];
    for ( var id in tables ) {
        var tablePath= path + '.tables.' + id;
        result.push({
            index: id,
            tablePath: tablePath,
            hrefXml: SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=xml'),
            hrefCsv: SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=csv'),
        });
    }
    return result;
});

T.helper('keys', function() {
    var self= this;
    return Object.keys(self).map(function( key ) {
        var objectVal= {};
        var simpleValue= SpongeTools.valueToString(self[key], { returnOnObject: objectVal });
        return {
            key: key,
            objectValue: simpleValue === objectVal && self[key],
            simpleValue: new Handlebars.SafeString(simpleValue),
        };
    });
});

/*
T.events({
    'click a.resultTable': function( event ) {
        var $a= $(event.currentTarget);
        var path= $a.attr('path');
        var format= $a.attr('format');
        console.log('getResultTable', jobId(), path, format);
    },
});
*/
