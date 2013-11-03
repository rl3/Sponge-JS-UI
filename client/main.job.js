
var ItemsPerPage= 50;
var jobUpdateTimeout= 10000; // 10s

var injectVar= DataObjectTools.injectVar;

var invalidateList= DataObjectTools.getInvalidator();

var getJob= DataObjectTools.getCachedData('getJob', 2000);

// var getJobLog= DataObjectTools.getCachedData('getJobLog', 2000);
var getJobLog= DataObjectTools.postData('getJobLog');
var deleteJobLog= DataObjectTools.postData('deleteJobLog');

var getJobResult= DataObjectTools.getCachedData('getJobResult', 2000);

var _restartJob= DataObjectTools.getCachedData('restartJob', 2000);
var restartJob= function() {
    _restartJob(DataObjectTools.jobId());
};

var _removeJob= DataObjectTools.getCachedData('removeJob', 2000);
var removeJob= function() {
    _removeJob(DataObjectTools.jobId());
    DataObjectTools.jobId(undefined);
};

var _getModel= DataObjectTools.getCachedData('getModel');
var getModel= function() {
    return _getModel(DataObjectTools.modelId());
};

var T= DataObjectTools.Template;


T.select('jobStatus');

T.helper('status', function() {
    var jobId= this.jobId;
    var realJob= getJob(jobId) || this;
    if ( !realJob.status.finished ) watchJob(jobId);
    return {
        id: jobId,
        job: realJob,
        startTime: realJob.status.started.toLocaleString(),
        classes: function() {
            var classes= [];
            if ( DataObjectTools.jobId() === jobId ) classes.push('active');
            if ( realJob.status.error )              classes.push('error');
            if ( realJob.status.success )            classes.push('success');
            if ( !realJob.status.finished )          classes.push('running');

            return classes.join(' ');
        },
    };
});

T.events({
    'click .jobId a': function( event ) {
        DataObjectTools.jobId(this.id);
    },
});


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
    if ( !model ) return DataObjectTools.valueToString(DataObjectTools.modelId());

    return model.name;
});

T.helper('args', function() {
    if ( !this.inArgs || !this.inArgs.args ) return;

    var args= this.inArgs.args;
    return Object.keys(args).map(function( argName ) {
        return {
            name: argName,
            value: DataObjectTools.valueToString(args[argName]),
        };
    });
});

var setLogResult= function( content ) {
    $('#jobLog pre').html(content);
};

T.events({
    'click button.show-log': function( event ) {
        setLogResult('');
        DataObjectTools.showModal($('#jobLog'));

        var jobId= DataObjectTools.jobId();
        if ( !jobId ) return;

        var log= getJobLog(jobId, function(err, result) {
            if ( err ) console.error(err);
            setLogResult((result || {}).content);
        });

    },
    'click button.delete-log': function( event ) {
        var jobId= DataObjectTools.jobId();
        if ( !jobId ) return;

        var log= deleteJobLog(jobId, function(err, result) {});

    },
    'click button.rerun-job': restartJob,
    'click button.delete-job': removeJob,
});


T.select('jobResult');

T.helper('results', function() {
    var jobId= DataObjectTools.jobId();
    if ( !jobId ) return;

    var result= getJobResult({ jobId: jobId, path: '', });
    if ( !result ) return;

    return Object.keys(result).map(function( key ) {
        return {
            resultId: key,
            result: result[key],
        }
    });
});

$(function( $ ) {
    $('body').on('click', '.job-subResult .collapse-icon', function() {
        var $parent= $(this).closest('.job-subResult');
        $parent.toggleClass('collapsed').toggleClass('expanded');
        $(this).toggleClass('icon-plus').toggleClass('icon-minus');
    });
});

T.helper('keys', function() {
    var self= this;
    return Object.keys(self).map(function( key ) {
        var objectVal= {};
        var simpleValue= DataObjectTools.valueToString(self[key], { returnOnObject: objectVal });
        return {
            key: key,
            objectValue: simpleValue === objectVal && self[key],
            simpleValue: new Handlebars.SafeString(simpleValue),
        };
    });
});
