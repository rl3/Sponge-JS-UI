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
 * run every helper function
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

var errorInitialized= 0;

Accounts.onLogin(function() {
    errorInitialized= new Date();
});

T.helper('showErrors', function() {
    var error= SpongeTools.getError();

    if ( !error || +error.date < +errorInitialized ) return;

    var time= SpongeTools.valueToString(error.date || 'unknown');

    var $message= $(
        '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><div class="time">' + time + '</div><div class="message">' + SpongeTools.valueToString(error.error) + '</div></div>'
    );

    var hide= function() {
        $message.hide(function() {
            $message.remove();
        });
    };

    $message.on('click', 'a', hide);

    $('#global-error-messages').append($message.show(function() {
//        Meteor.setTimeout(hide, 20000);
    }));
});

SpongeTools.lazyHelper= {
    addJob: addJob,
    jobRunning: jobRunning,
    addInvalidator: addInvalidator,
};
