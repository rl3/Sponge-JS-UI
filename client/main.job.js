
var ItemsPerPage= 50;
var jobUpdateTimeout= 10000; // 10s

var injectVar= SpongeTools.injectVar;

var jobId= SpongeTools.jobId;

var invalidateJob= SpongeTools.invalidateJob;

var _saveJobTitle= SpongeTools.postData('setJobTitle');
var saveJobTitle= function( title ) {
    _saveJobTitle({ jobId: jobId(), title: title });
};

var _saveJobDescription= SpongeTools.postData('setJobDescription');
var saveJobDescription= function( description ) {
    _saveJobDescription({ jobId: jobId(), description: description });
};

var editorContext= SpongeTools.editorContext(function( context, property ) {

    switch ( property ) {
        case 'title': saveJobTitle(context.title); break;
        case 'text': saveJobDescription(context.text); break;
    }

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

// object to hold map args reactively
var resultMapArgsCtxt= {};

var _restartJob= SpongeTools.getCachedData('restartJob', 2000);
var restartJob= function() {
    _restartJob(jobId(), function() {
        SpongeTools.invalidateJobList(true);
        invalidateJob(jobId(), true);
    });
};

var _deleteJob= SpongeTools.getCachedData('deleteJob', 2000);
var deleteJob= function() {
    var _jobId= jobId();
    _deleteJob(_jobId, function() {
        SpongeTools.invalidateJobList(true);
        jobId(undefined);
        SpongeTools.localSession('main-navigation')('view', undefined);
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
    if ( this.status.error )     return new Spacebars.SafeString('Error:<br /><code>' + this.status.error + '</code>');
    if ( this.status.success )   return 'Successfully finished';
    if ( !this.status.finished ) return 'Running';
    return '';
});

T.helper('startTime', function() {
    return this.status && this.status.started && this.status.started.toLocaleString();
});

T.helper('finishTime', function() {
    return this.status && this.status.finished && this.status.finished.toLocaleString();
});

T.helper('model', function() {
    var model= getModel();
    if ( !model ) return SpongeTools.valueToString(SpongeTools.modelId());

    return model.name;
});

T.helper('descriptionTitleContext', function() {
    return editorContext(this.description, 'title');
});

T.helper('descriptionTextContext', function() {
    return editorContext(this.description, 'text');
});

var setLogResult= function( content ) {
    $('#jobLog pre').html(content);
};

T.events({
    'click button.show-log': function( event ) {
        setLogResult('');
        SpongeTools.Modal.show($('#jobLog'));

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
    'click button.delete-job': deleteJob,
    'click button.share-job': function( event ) {
        // FIXME: do we have the job object already?
        var id= (getJob() || {})._id;
        SpongeTools.shareObject({ type: 'Job', id: id });
        SpongeTools.Modal.show($('#shareObject'));
    },
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
    return new Spacebars.SafeString('<i class="' + (showArgs(this)() ? 'icon-chevron-down' : 'icon-chevron-right') + '"></i>');
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

    var model= getModel();
    var info= (((model || {}).definition || {}).info || {}).result || {};

    return Object.keys(result).filter(function( key ) {
        return key !== 'tables';
    }).map(function( key ) {
        var value= SpongeTools.valueToString(result[key], { onLocation: onLocation, onObject: onObject, onArray: onObject });
        if ( ! value ) return;

        return {
            name: key,
            value: value,
            info: info[key] || {},
        }
    }).filter(function( result ) {
        return result;
    }).sort(SpongeTools.indexSortFn);
});

T.helper('resultTables', function() {
    var tables= this.tables;
    if ( !tables || !tables.length ) return;

    var model= getModel();
    var info= ((((model || {}).definition || {}).info || {}).result || {}).tables || {};

    var result= [];
    tables.forEach(function( tableList ) {
        for ( var id in tableList.tables ) {
            var tablePath= tableList.path.join('.') + '.tables.' + id;

            // remove resultId and 'result' from path
            var path= tableList.path.slice(2);
            path.push(id);
            var index= path.join('.');
            result.push({
                index: index,
                tablePath: tablePath,
                jobId: jobId(),
                info: info[index] || {},
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

    var resultMapArgs= injectVar(resultMapArgsCtxt, path);

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
T.helper('templateHelper', function() {
    var path= this.tablePath;
    var args= injectVar(resultMapArgsCtxt, path, undefined);

    if ( !args() ) return null;

    var data= getJobResultMap(jobId(), this.tablePath, args());
    if ( !data ) return Template.loadingImage;

    // unset arguments to prevent running into this function again
    // (was a bug in windows-browsers, calling this function repeatedly)
    delete resultMapArgsCtxt[path];

    var fileName= data.headers['content-disposition'];
    if ( fileName ) {
        var match= fileName.match(/filename\=\"(.+)\"/); //"
        if ( match ) fileName= match[1];
    }

    SpongeTools.downloadLink(data.url, {
        query: {
            contentType: data.headers['content-type'],
            fileName: fileName || 'resultMap.kml',
        },
    });
    return null;
});


