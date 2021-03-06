
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

var _getJob= SpongeTools.getCachedData('getJob', SpongeTools.TIMEOUT_SHORT);
var getJob= function( _jobId ) {
    if ( !_jobId ) _jobId= jobId();
    invalidateJob(_jobId);
    return _getJob(_jobId);
};

// var getJobLog= SpongeTools.getCachedData('getJobLog', SpongeTools.TIMEOUT_SHORT);
var getJobLog= SpongeTools.postData('getJobLog');
var deleteJobLog= SpongeTools.postData('deleteJobLog');
var deleteResult= SpongeTools.postData('deleteResult');
var deleteArchive= SpongeTools.postData('deleteArchive');

var _getJobResult= SpongeTools.getCachedData('getJobResult', SpongeTools.TIMEOUT_SHORT);
var getJobResult= function( jobId, path ) {
    invalidateJob(jobId);
    return _getJobResult(jobId, path);
};

var _getJobResultMapArgs= SpongeTools.getCachedData('getJobResultMapArgs', SpongeTools.TIMEOUT_SHORT);
var getJobResultMapArgs= function( jobId, path ) {
    return _getJobResultMapArgs(jobId, path);
};

var _getJobResultMap= SpongeTools.getCachedData('getJobResultMap', SpongeTools.TIMEOUT_SHORT);
var getJobResultMap= function( jobId, path, data, format ) {
    return _getJobResultMap(jobId, path, data, format);
};

var _restartJob= SpongeTools.getCachedData('restartJob', SpongeTools.TIMEOUT_SHORT);
var restartJob= function() {
    _restartJob(jobId(), function() {
        SpongeTools.invalidateJobList(true);
        invalidateJob(jobId(), true);
    });
};

var _deleteJob= SpongeTools.getCachedData('deleteJob', SpongeTools.TIMEOUT_SHORT);
var deleteJob= function() {
    SpongeTools.Confirmation.show({ title: 'Delete Job', body: 'Do you really want to delete this job?' }, function() {
        var _jobId= jobId();
        _deleteJob(_jobId, function() {
            SpongeTools.invalidateJobList(true);
            jobId(undefined);
            SpongeTools.viewType(undefined);
        });
        jobId(undefined);
    });
};

var _getModel= SpongeTools.getCachedData('getArchiveModel');
var getModel= function() {
    var job= getJob();
    if ( !job ) return;

    return SpongeTools.cleanObject(_getModel(job.modelId, job.jobId));
};

var T= SpongeTools.Template;

/**
 * Template job
 */
T.select('job');

T.helper('statusClass', function() {
    if ( !this.status ) return;
    if ( this.status.error )     return 'error';
    if ( this.status.success )   return 'success';
    if ( !this.status.finished ) return 'running';
    return '';
});

var correctError= function( error ) {
    error= error.replace(/([^\\])\\'/g, '$1').replace(/(^|[^\\])'/g, '$1');
    error= error.replace(/\\+'/g, '\'').replace(/\\+n/g, '<br/>\n');
    error= error.replace(/ /g, '&nbsp;');
    return error;
}

T.helper('status', function() {
    if ( !this.status ) return;
    if ( this.status.error )     return new Spacebars.SafeString('Error:<br /><code>' + correctError(this.status.error) + '</code>');
    if ( this.status.success )   return 'Successfully finished';
    if ( !this.status.finished ) return 'Running';
    return '';
});

T.helper('startTime', function() {
    if ( this.status && this.status.started ) {
        return SpongeTools.dateToString(this.status.started) + ' ' + SpongeTools.timeToString(this.status.started);
    }
});

T.helper('finishTime', function() {
    if ( this.status && this.status.finished ) {
        return SpongeTools.dateToString(this.status.finished) + ' ' + SpongeTools.timeToString(this.status.finished);
    }
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

        deleteJobLog(jobId, function(err, result) {});
    },
    'click button.delete-archive': function( event ) {
        var jobId= SpongeTools.jobId();
        if ( !jobId ) return;

        return SpongeTools.Confirmation.show(
            {
                title: 'Delete job archive',
                body: "Do you really want to delete this job's model archive?<br/>"
                    + "All models used in previous runs will be removed from archive and current versions will be used in further runs",
            },
            function() {
                deleteArchive(jobId, function(err, result) {});
            }
        );

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
    if ( obj.tableFields ) {
        tables.push({
            path: path.join('.').split('.'),
            tables: obj.tableFields,
        });
        delete obj.tableFields;
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

    var results= Object.keys(jobResult).map(function( id ) {
        if ( !jobResult[id] || typeof jobResult[id] !== 'object' ) return;

        var result= jobResult[id].result;

        var tables= [];
        if ( result ) filterTables(result, tables, [id, 'result']);
        return {
            id: id,
            time: SpongeTools.valueToString(jobResult[id].time),
            args: (jobResult[id].args || {}).args,
            result: result,
            tables: tables,
        };
    }).filter(function( r ) { return r; });

    if (results.length) {

        // sort descending
        results.sort(function( a, b ) { return String(b.time).localeCompare(String(a.time)); });
        results[0].first= true;
    }

    return results;
});

T.helper('hiddenClass', function() {
    if ( !this.first ) return 'hidden';
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

    // hack: remove 'show' .more-options due to too efficient reuse of DOM objects
    $('.more-options').removeClass('show');

    // empty resultMapArgsCtxt to free unneeded reactive values
    resultMapArgsCtxt= {};
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
                isMap: tableList.tables[id].indexOf('polygonKey') >= 0,
                hrefXml:  SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=xml'),
                hrefCsv:  SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=csv'),
                hrefXlsx: SpongeTools.buildApiUrl('/Job/getResultTable/' + jobId() + '/' + tablePath + '?format=xlsx'),
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

T.helper('loading', function() {
    if ( !this.mapLoadingInvalidator ) {
        this.mapLoadingInvalidator= SpongeTools.getInvalidator('jobMapResult');
    }
    this.mapLoadingInvalidator();

    var jobId= this.jobId;
    var path= this.tablePath;

    var formats= ['kml', 'xml', 'csv', 'xlsx'];
    for ( var i in formats ) {
        var format= formats[i];
        if (
            SpongeTools.lazyHelper.jobRunning('args:' + jobId + ':' + path + ':' + format)
            || SpongeTools.lazyHelper.jobRunning('link:' + jobId + ':' + path + ':' + format)
        ) return Template.loadingImage;
    }
    return null;
});

var clickEvent= function( format ) {
    return function( event ) {
        var self= this;
        var jobId= this.jobId;
        var path= this.tablePath;

        if ( !this.mapLoadingInvalidator ) {
            this.mapLoadingInvalidator= SpongeTools.getInvalidator('jobMapResult');
        }
        var loadingInvalidator= this.mapLoadingInvalidator;

        var lazyJobId= 'args:' + jobId + ':' + path + ':' + format;
        SpongeTools.lazyHelper.addInvalidator(lazyJobId, loadingInvalidator);
        SpongeTools.lazyHelper.addJob(lazyJobId, function() {

            // if clicked, get map args
            var args= getJobResultMapArgs(jobId, path);
            if ( args === undefined ) return true;

            var _args= SpongeTools.buildValues(args, 'args', self);

            SpongeTools.valuesInput(
                _args, {
                    title: 'Arguments for map "' + self.index + '"',
                    simple: true,
                }, function( newArgs ) {
                    var result= { args: newArgs };
                    if ( 'transient' in args ) result.transient= args.transient;

                    var lazyJobId= 'link:' + jobId + ':' + path + ':' + format;
                    SpongeTools.lazyHelper.addInvalidator(lazyJobId, loadingInvalidator);
                    return SpongeTools.lazyHelper.addJob(lazyJobId, function() {
                        var data= getJobResultMap(jobId, path, result, format);

                        // while no data keep lazy job (return false for empty result)
                        if ( !data ) return data !== null;

                        // if no url, remove lazyJob
                        if ( !data.url ) return false;

                        var url= SpongeTools.buildApiUrl(data.url);

                        var contentType, target;
                        switch ( format ) {
                            case 'csv': contentType= 'text/comma-separated-values'; break;
                            case 'xml': contentType= 'text/xml'; target= '_new'; break;
                            default: contentType= 'application/vnd.google-earth.kml+xml'; break;
                        }

                        SpongeTools.downloadLink(url, {
                            query: {
                                contentType: contentType,
                                fileName: path + '.' + format,
                            },
                            target: target,
                        });

                        // remove lazyJob
                        return false;
                    });
                }
            );

            // remove lazyJob
            return false;
        });
        return false;
    };
};


T.events({
    'click .result.toggle': function( event ) {
        $(event.currentTarget)
            .toggleClass('icon-chevron-right')
            .toggleClass('icon-chevron-down')
            .parent().find('div:first').toggleClass('hidden')
        ;
        return false;
    },
    'click a.resultMapKml': clickEvent('kml'),
    'click a.resultMapXml': clickEvent('xml'),
    'click a.resultMapCsv': clickEvent('csv'),
    'click a.resultMapXlsx': clickEvent('xlsx'),
    'click a.delete-result': function( event ) {
        SpongeTools.Confirmation.show({ title: 'Delete Result', body: 'Do you really want to delete this result?'}, function() {
            deleteResult(jobId(), this.id)
        }.bind(this));
        return false;
    },
});

