
var injectVar= SpongeTools.injectVar;

var getJobQueue= SpongeTools.getCachedData('getJobQueue', 2000);
var removeJob= SpongeTools.getCachedData('removeJobFromQueue', 2000);

var invalidateJobQueue= SpongeTools.invalidateJobQueue;

var getJob= SpongeTools.getCachedData('getJob');

var T= SpongeTools.Template;

var queueUpdater= setInterval(function() { invalidateJobQueue(true); }, 10000);
var jobListVisible= injectVar({}, 'visible', false);

/**
 * Template systemInfo
 */
T.select('systemInfo');

T.events({
    'click button.show-hide': function( event ) {
        jobListVisible(!jobListVisible());
    },
});


T.select('jobCount');

T.helper('jobCount', function() {
    invalidateJobQueue();
    var queue= getJobQueue();
    if ( !queue ) return 'pease wait...';

    if ( !queue.length ) return 'no jobs in queue';

    var running= queue.filter(function( e ) { return e.state === 'running'; }).length;
    return running + ' of ' + queue.length + ' running jobs';
});


T.select('jobQueue');

T.helper('jobListVisible', function() {
    return jobListVisible();
});

T.helper('jobs', function() {
    invalidateJobQueue();
    return getJobQueue();
});

T.helper('state', function() {
    switch ( this.state ) {
        case 'running': return 'icon-play';
        default:        return 'icon-pause';
    }
});

T.helper('stateText', function() {
    return this.state;
});

T.helper('description', function() {
    var job= getJob(this.jobId);
    var result= [];

    if ( job ) {
        result.push('Description: ' + job.description.text);
    };
    if ( this.started ) result.push('Started: ' + this.started);
    result.push('Queued: ' + this.queued);

    return result.join('\n');
});

T.helper('name', function() {
    var job= getJob(this.jobId);
    return job ? job.description.title : this.jobId;
});

T.events({
    'click a.job-remove': function( event ) {
        removeJob(this.jobId);
        invalidateJobQueue(true);
        return false;
    },
});
