'use strict';

var T= SpongeTools.Template;

var lazyInvalidator= SpongeTools.getInvalidator();

var lazyJobs= {};

var addJob= function( id, fn ) {
    var job= lazyJobs[id];

    if ( job ) {
        delete lazyJobs[id];
        job.fn= fn;
    }
    else {
        job= {
            fn: fn,
        };
    }

    lazyJobs[id]= job;

    if ( job.invalidator ) job.invalidator(true);

    lazyInvalidator(true);
};

var jobRunning= function( id ) {
    return id in lazyJobs && lazyJobs[id].fn;
};

var addInvalidator= function( id, invalidator ) {
    var job= lazyJobs[id];

    if ( job ) {
        job.invalidator= invalidator;
        return;
    }

    lazyJobs[id]= {
        invalidator: invalidator,
    };
};

T.select('lazyHelper');

/**
 * run ever helper function
 * if helper function returns NOT TRUE, call invalidator and remove job
 */
T.helper('doJob', function() {
    lazyInvalidator();
    Object.keys(lazyJobs).forEach(function( id ) {
        var job= lazyJobs[id];

        if ( !job.fn || job.fn(id, job.invalidator) ) return;

        if ( job.invalidator ) job.invalidator(true);

        delete lazyJobs[id];
    });
});

SpongeTools.lazyHelper= {
    addJob: addJob,
    jobRunning: jobRunning,
    addInvalidator: addInvalidator,
};
