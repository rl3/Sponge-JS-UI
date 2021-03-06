
var injectVar= SpongeTools.injectVar;

var getJobQueue= SpongeTools.getCachedData('getJobQueue', SpongeTools.TIMEOUT_SHORT);
var removeJob= SpongeTools.getCachedData('removeJobFromQueue', SpongeTools.TIMEOUT_SHORT);

var invalidateJobQueue= SpongeTools.invalidateJobQueue;

var getJob= SpongeTools.getCachedData('getJob');

var T= SpongeTools.Template;

var queueUpdater= setInterval(function() { invalidateJobQueue(true); }, 10000);
var jobListVisible= injectVar({}, 'visible', false);

/**
 * Template systemInfo
 */
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
        if ( job.description ) {
            result.push('Description: ' + job.description.text);
        }
        else {
            result.push('Other user\'s job');
        }
    };
    if ( this.started ) result.push('Started: ' + this.started);
    result.push('Queued: ' + this.queued);

    return result.join('\n');
});

T.helper('name', function() {
    var job= getJob(this.jobId);
    return job && job.description && job.description.title ? job.description.title : this.jobId;
});

T.events({
    'click button.job-remove': function( event ) {
        removeJob(this.jobId);
        invalidateJobQueue(true);
        return false;
    },
});
