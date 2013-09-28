
var ItemsPerPage= 50;

var injectVar= DataObjectTools.injectVar;

var _getJobs= DataObjectTools.getCachedData('getJobs', 2000);
var getJobs= function() {
    var jobs= _getJobs({
        userId: null,
        modelId: DataObjectTools.modelId(),
    });
    if ( !jobs ) return;

    jobs.sort(function( j1, j2 ) {
        return j2.status.started - j1.status.started;
    });
    return jobs;
};

var getJob= DataObjectTools.getCachedData('getJob', 2000);

var getJobLog= DataObjectTools.postData('getJobLog');

var _getModel= DataObjectTools.getCachedData('getModel');
var getModel= function() {
    return _getModel(DataObjectTools.modelId());
};

Template.jobs.pagination= function() {
    var jobs= getJobs();
    if ( !jobs ) return;

    var count= Math.floor(jobs.length / ItemsPerPage);
    if ( count * ItemsPerPage < jobs.length ) count++;

    return new Handlebars.SafeString(Template.pagination({count: count, pageNumber: injectVar(this, 'pageNumber', 0), }));
};

Template.jobs.model= getModel;

Template.jobs.jobs= function( modelId ) {
    var jobs= getJobs();
    if ( !jobs ) return;

    return jobs.slice(injectVar(this, 'pageNumber', 0)() * ItemsPerPage, ItemsPerPage).map(function( job ) {
        return {
            id: job.jobId,
            job: job,
            startTime: job.status.started.toLocaleString(),
            classes: function() {
                var classes= [];
                if ( DataObjectTools.jobId() === job.jobId ) classes.push('active');
                if ( job.status.error )                      classes.push('error');
                if ( job.status.success )                    classes.push('success');
                if ( !job.status.finished )                  classes.push('running');

                return classes.join(' ');
            },
        };
    });
};

Template.jobs.currentJob= function() {
    var jobId= DataObjectTools.jobId();
    if ( !jobId ) return;

    var jobs= getJobs();
    for ( var i in jobs ) {
        if ( jobs[i].jobId === jobId ) return jobs[i];
    }
};

Template.jobs.events({
    'click .jobId a': function( event ) {
        DataObjectTools.jobId(this.id);
    }
});


/**
 * Template job
 */
Template.job.statusClass= function() {
    if ( this.status.error )     return 'error';
    if ( this.status.success )   return 'success';
    if ( !this.status.finished ) return 'running';
    return '';
};

Template.job.status= function() {
    if ( this.status.error )     return new Handlebars.SafeString('Error:<br /><code>' + this.status.error + '</code>');
    if ( this.status.success )   return 'Successfully finished';
    if ( !this.status.finished ) return 'Running';
    return '';
};

Template.job.startTime= function() {
    return this.status.started.toLocaleString();
};

Template.job.finishTime= function() {
    return this.status.finished.toLocaleString();
};

Template.job.model= function() {
    var model= getModel();
    if ( !model ) return DataObjectTools.valueToString(DataObjectTools.modelId());

    return model.name;
};

Template.job.args= function() {
    if ( !this.inArgs || !this.inArgs.args ) return;

    var args= this.inArgs.args;
    return Object.keys(args).map(function( argName ) {
        return {
            name: argName,
            value: DataObjectTools.valueToString(args[argName]),
        };
    });
};

Template.job.events({
    'click a.show-log': function( event ) {
        return getJobLog([this.jobId], {
            onResultReceived: function() {
                console.log(arguments);
            }
        }, function() {console.log(arguments)});
    },
});
