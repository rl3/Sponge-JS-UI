
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

var _getJobResult= SpongeTools.getCachedData('getJobResult', 2000);
var getJobResult= function( jobId, path ) {
    invalidateJob(jobId);
    return _getJobResult(jobId, path);
};

var _getJobResultMapArgs= SpongeTools.getCachedData('getJobResultMapArgs', 2000);
var getJobResultMapArgs= function( jobId, path ) {
    return _getJobResultMapArgs(jobId, path);
};

var _getJobResultMap= SpongeTools.getCachedData('getJobResultMap', 2000);
var getJobResultMap= function( jobId, path, data ) {
    return _getJobResultMap(jobId, path, data);
};

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
});

T.select('jobArgs');

var onLocation= function( value, options, defaultFn ) {
    var job= getJob();

    if ( !job ) return defaultFn(value, options);

    var $result= $('<p>' + defaultFn(value, options) + '</p>');
    $result.find('a')
        .attr('info-title', 'Job: "' + job.description.title + '"')
        .attr('info-text', job.description.text)
    ;
    return $result.html();
};

var onObject= function( value, options, defaultFn ) {
};

T.helper('args', function() {
    var args= this.args;

    if ( !args ) return;

    return Object.keys(args).map(function( argName ) {
        return {
            name: argName,
            value: SpongeTools.valueToString(args[argName], { onLocation: onLocation }),
        };
    });
});

var showArgs= function( context ) {
    return injectVar(context, 'showHide', false);
};

T.helper('showHideArgsText', function() {
    return new Handlebars.SafeString('<i class="' + (showArgs(this)() ? 'icon-chevron-down' : 'icon-chevron-right') + '"></i>');
});

T.helper('showArgs', function() {
    return showArgs(this)();
});

T.events({
    'click a.show-hide-args': function( event ) {
        showArgs(this)(!showArgs(this)());
    },
});

T.select('jobResult');

var filterTables= function( obj, tables, path ) {
    if ( obj.tables ) {
        tables.push({
            path: path.join('.').split('.'),
            tables: obj.tables,
        });
        delete obj.tables;
    }
    for ( var name in obj ) {
        if ( obj[name] && typeof obj[name] === 'object' && obj[name].constructor === Object ) {
            path.push(name);
            filterTables(obj[name], tables, path);
            path.pop();
        }
    }
};

T.helper('result', function() {
    var jobId= SpongeTools.jobId();
    if ( !jobId ) return;

    var jobResult= getJobResult(jobId, '');

    if ( !jobResult ) return;

    return Object.keys(jobResult).map(function( id ) {
        var result= jobResult[id].result;
        var tables= [];
        if ( result ) filterTables(result, tables, [id, 'result']);
        return {
            id: id,
            args: (jobResult[id].args || {}).args,
            result: result,
            tables: tables,
        };
    });
});

var onObject= function( value, options, defaultFn ) {
    var out= defaultFn(value, options);
    return '<i class="result toggle icon-chevron-right"></i><div class="sub-result hidden">' + out + '</div>';
//    return '<table width="100%"><tr valign="top"><td width="1%"><i class="result toggle icon-chevron-right"></i></td><td class="hidden">' + out + '</td></tr></table>';
};

T.helper('resultMap', function() {
    var result= this.result || {};

    return Object.keys(result).filter(function( key ) {
        return key !== 'tables';
    }).map(function( key ) {
        var value= SpongeTools.valueToString(result[key], { onLocation: onLocation, onObject: onObject, });
        if ( ! value ) return;

        return {
            resultName: key,
            resultValue: value,
        }
    }).filter(function( result ) {
        return result;
    });
});

T.helper('resultTables', function() {
    var tables= this.tables;
    if ( !tables || !tables.length ) return;

    var result= [];
    tables.forEach(function( tableList ) {
        for ( var id in tableList.tables ) {
            var tablePath= tableList.path.join('.') + '.tables.' + id;

            // remove resultId and 'result' from path
            var path= tableList.path.slice(2);
            path.push(id);
            result.push({
                index: path.join('.'),
                tablePath: tablePath,
                jobId: jobId(),
                hrefXml: SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=xml'),
                hrefCsv: SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=csv'),
            });
        }
    });
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
            simpleValue: simpleValue,
        };
    });
});

T.events({
    'click .result.toggle': function( event ) {
        $(event.currentTarget)
            .toggleClass('icon-chevron-right')
            .toggleClass('icon-chevron-down')
            .parent().find('div:first').toggleClass('hidden')
        ;
        return false;
    },
    'click a.resultMap': function( event ) {
        injectVar(this, 'clicked')(true);
        return false;
    },
});

T.select('jobResultMapLink');

/**
 * helper does not return anything
 * it's simply a handler to show a dialog for map arguments
 */
T.helper('clicked', function() {
    var clicked= injectVar(this, 'clicked', false);

    if ( !clicked() ) return;

    var _jobId= jobId();
    var path= this.tablePath;

    // if clicked, get map args
    var args= getJobResultMapArgs(_jobId, path);
    if ( args === undefined ) return;

    // on result reset 'clicked'-status
    clicked(false);

    var _args= SpongeTools.buildValues(args, 'args', this);

    var resultMapArgs= injectVar(this, 'resultMapArgs');

    SpongeTools.valuesInput(
        _args, {
            title: 'Arguments for map "' + this.index + '"',
            simple: true,
        }, function( newArgs ) {
            var result= { args: newArgs };
            if ( 'transient' in args ) result.transient= args.transient;

            resultMapArgs(result);
        }
    );
});

T.select('jobResultMapResult');

/**
 * helper does not return anything
 * it's simply a handler to show a dialog for map arguments
 */
T.helper('data', function() {
    var args= injectVar(this, 'resultMapArgs', undefined);

    if ( !args() ) return;

/*
    $.fileDownload(SpongeTools.buildApiUrl('Job/getResultMap/af964b534b8325a269bc18d64104ea73/52b1e9f626ee39d96a000001.result.tables.sumPerMainCrop'), {
//        preparingMessageHtml: "We are preparing your report, please wait...",
//        failMessageHtml: "There was a problem generating your report, please try again.",
        httpMethod: "PUT",
        data: {"args":{"valueField":"etc[l]","putPlacemarks":true,"alpha":0.7,"polyAlpha":0.5,"outlineWidth":1,"outlineColor":"7f0000ff","points":10,"precision":1,"reverse":false,"extrude":false,"offset":35,"dimensionX":100,"dimensionY":335,"color":"default","font":"Georgia","propFields":["*"]},"transient":{"values":[],"createLegend":true}},
    });

    return;
*/

    // TODO: offer returned Data for download
    var data= getJobResultMap(jobId(), this.tablePath, args());
    if ( !data ) return;

    var fileName= data.headers['content-disposition'];
    if ( fileName ) {
        var match= fileName.match(/filename\=\"(.+)\"/); //"
        if ( match ) fileName= match[1];
    }

    SpongeTools.download(data.content, {
        contentType: data.headers['content-type'],
        fileName: fileName || 'resultMap.kml',
    });
});


