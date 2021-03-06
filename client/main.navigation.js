
var modelId= SpongeTools.modelId;
var jobId= SpongeTools.jobId;
var str2Oid= SpongeTools.str2Oid;
var oid2Str= SpongeTools.oid2Str;
var cleanObject= SpongeTools.cleanObject;
var getInvalidator= SpongeTools.getInvalidator;
var invalidateJob= SpongeTools.invalidateJob;
var invalidateModel= SpongeTools.invalidateModel;


var viewType= SpongeTools.viewType;
var sortType= SpongeTools.ReactiveValue();
var allUsers= SpongeTools.ReactiveValue();


Accounts.onLogin(function() {
    viewType(undefined);
    modelId(undefined);
    jobId(undefined);
});

var T= SpongeTools.Template;

T.select('mainHeader');

var buildHeader= function( title, object, property ) {

    var result= {
        main: title,
    };

    switch ( typeof object ) {
        case 'object':
            object= cleanObject(object);

            if ( object ) {
                if ( object._id ) result.addition= SpongeTools.valueToString(str2Oid(object._id));
                var title= SpongeTools.getProperty(object, property);
                if ( title ) result.title= title;
            }
            else {
                result.message= 'please select left';
            }
            break;

        case 'undefined':
            result.message= 'please wait...';
            break;

        default:
            result.message= String(object);
    }

    return result;
};

T.helper('header', function() {
    if ( SpongeTools.Mode === 'exportWizard' ) return buildHeader('', '');
    switch ( viewType() ) {
        case 'model': return buildHeader('Model', getModel(modelId()), 'name');
        case 'job': return buildHeader('Job', getJob(jobId()), 'description.title');
        case 'user': return buildHeader('User Management', SpongeTools.editUsername());
    }
});

T.select('mainNavigation');

T.call('onRendered', function() {
    this.$('.accordion .collapse').collapse({ toggle: false, });
    switch (viewType() || 'model' ) {
        case 'model': $('#main-navigation-accordion-model').collapse('show'); break;
        case 'job':   $('#main-navigation-accordion-job').collapse('show'); break;
        case 'user':  $('#main-navigation-accordion-user').collapse('show'); break;
    }
});

/**
 * TEMPLATE mainNavigationHeader
 */
T.select('mainNavigationHeader');

var getSort= function() {
    return sortType() || { key: 'date', order: 1 };
};

var setSort= function( key, order ) {
    sortType({ key: key, order: order });
};

var sortChar= function( order ) {
    return new Spacebars.SafeString(order > 0 ? '&#9660;' : '&#9650;');
};

T.helper('sortDate', function() {
    var sort= getSort();
    if ( sort.key !== 'date' ) return;

    return sortChar(sort.order);
});

T.helper('sortName', function() {
    var sort= getSort();
    if ( sort.key !== 'name' ) return;

    return sortChar(sort.order);
});

T.helper('switchAll', function() {
    return allUsers() ? 'btn-primary' : '';
});

T.helper('switchMy', function() {
    return allUsers() ? '' : 'btn-primary';
});

T.events({
    'click a': function( event ) {
        var sortName= $(event.currentTarget).attr('sort');
        var sortOrder= 1;

        var oldSort= getSort();

        if ( oldSort.key === sortName ) {
            sortOrder= -oldSort.order;
        }
        setSort(sortName, sortOrder);
    },
    'click button': function( event ) {
        allUsers(!allUsers());
        return false;
    },
});

var _getJobs= SpongeTools.getCachedData('getJobs', SpongeTools.TIMEOUT_SHORT);
var getJobs= function( options ) {
    SpongeTools.invalidateJobList();
    if ( !options ) options= {};
    if ( !allUsers() ) options.userId= Meteor.user().username;

    var jobs= _getJobs(options);
    return jobs;
};

var _getAllModels= SpongeTools.getCachedData('getModels');
var getAllModels= function() {
    SpongeTools.invalidateModelList();
    return _getAllModels({});
};

var _getModel= SpongeTools.getCachedData('getModel');
var getModel= function( modelId ) {
    invalidateModel(modelId);
    return _getModel.apply(null, arguments);
};

var _getJob= SpongeTools.getCachedData('getJob', SpongeTools.TIMEOUT_SHORT);
var getJob= function( jobId ) {
    invalidateJob(jobId);
    return _getJob.apply(null, arguments);
};

T.select('mainNavigationModelTitle');

T.helper('modelName', function() {
    var _modelId= modelId();

    if ( ! _modelId ) return;

    var model= getModel(_modelId);
    return model && model.name ? model.name : SpongeTools.valueToString(str2Oid(_modelId));
});

T.helper('selected', function() {
    return modelId();
});

T.events({
    'click a': function() {
        modelId(undefined);

        // if model is current view, reset view to nothing
        if ( viewType() === 'model' ) viewType(null);
        return false;
    }
});

/**
 * TEMPLATE mainNavigationModels
 */
T.select('mainNavigationModels');

var sortFn= function() {
    var sort= getSort();
    return function( a, b ) {
        var akey= a[sort.key];
        var bkey= b[sort.key];
        if ( typeof akey === 'string' ) akey= akey.toLowerCase();
        if ( typeof bkey === 'string' ) bkey= bkey.toLowerCase();

        if ( akey < bkey )     return sort.order;
        if ( akey > bkey )     return -sort.order;
        if ( a.name < b.name ) return -1;
        if ( a.name > b.name ) return 1;
        return 0;
    };
};

var modelHelper= function() {
    if ( allUsers() ) {
        var models= getAllModels();
        if ( !models ) return;

        models= models.map(function( model ) {
            return {
                id: oid2Str(model._id),
                name: model.name,
                date: null,
            };
        });
        models.sort(sortFn());
        return models;
    }

    var jobs= getJobs();
    if ( !jobs ) return;

    var models= {};
    jobs.forEach(function( job ) {
        var id= oid2Str(job.modelId);
        var time= (job.status || {}).started || job.timeStamp;
        if ( !(id in models) || time > models[id] ) {
            models[id]= time;
        }
    });
    var result= Object.keys(models).map(function( modelId ) {
        var model= getModel(modelId);
        return {
            id: modelId,
            name: model && model.name ? model.name : SpongeTools.valueToString(str2Oid(modelId)),
            date: models[modelId],
        }
    });

    result.sort(sortFn());

    return result;
};

T.helper('loading', function() {
    var models= modelHelper.call(this);
    return models === undefined;
});

T.helper('models', modelHelper);

T.helper('date', function() {
    if ( this.date ) return SpongeTools.dateToString(this.date);
});

T.helper('time', function() {
    if ( this.date ) return SpongeTools.timeToString(this.date);
});

T.helper('rowClass', function() {
    if ( oid2Str(modelId()) === oid2Str(this.id) ) return 'selected';
});

T.events({
    'click .link': function( event ) {
        modelId(this.id);
        viewType('model');
    },
});


/**
 * TEMPLATE mainNavigationJobs
 */
T.select('mainNavigationJobs');

T.helper('loading', function() {
    var jobs= getJobs({ modelId: modelId() });
    return jobs === undefined;
});

var jobsToWatch= {};

var jobWatchTimer= null;

var dependOnJob= function( job ) {
    if ( !job.invalidator ) job.invalidator= getInvalidator('jobWatch' + job.jobId);
    job.invalidator();
};

var addJobWatchTimer= function( job ) {
    dependOnJob(job);

    jobsToWatch[job.jobId]= job.invalidator;

    if ( !jobWatchTimer ) jobWatchTimer= Meteor.setTimeout(jobTimer, 2000);
};

var jobTimer= function() {
    jobWatchTimer= null;

    for ( var jobId in jobsToWatch ) {
        jobsToWatch[jobId](true);
    }
};

T.helper('jobs', function() {
    var jobs= getJobs({ modelId: modelId() });
    if ( !jobs ) return;

    jobsToWatch= {};
    if ( jobWatchTimer ) {
        Meteor.clearTimeout(jobWatchTimer);
        jobWatchTimer= null;
    }

    var result= jobs.map(function( job ) {
        return {
            jobId: job.jobId,
            name: (job.description.title || '') + (job.description.text || ''),
            title: job.description.title || '',
            description: job.description.text || '',
            date: (job.status || {}).started || job.timeStamp,
            status: job.status,
        }
    });

    result.sort(sortFn());

    return result;
});

T.select('mainNavigationJobDetails');

var getStatusClasses= function( job ) {
    var classes= [];

    if ( !job.status ) return '';

    dependOnJob(job);

    if ( job.jobId in jobsToWatch ) delete jobsToWatch[job.jobId];

    if ( job.status.error )              classes.push('error');
    if ( job.status.success )            classes.push('success');
    if ( !job.status.finished ) {
        classes.push('running');
        addJobWatchTimer(job);
    }

    return classes.join(' ');
};

T.helper('details', function() {
    var job= getJob(this.jobId);

    if ( !job ) return this;

    dependOnJob(job);

    job.name= (job.title || '') + (job.description || '');
    job.date= job.status ? job.status.started : undefined;
    job._context= this;
    return job;
});

T.helper('date', function() {
    if ( this.date ) return SpongeTools.dateToString(this.date);
});

T.helper('time', function() {
    if ( this.date ) return SpongeTools.timeToString(this.date);
});

T.helper('title', function() {
    if ( this.description ) return this.description.title;
});

T.helper('description', function() {
    if ( this.description ) return this.description.text;
});

T.helper('rowClass', function() {
    var _class= getStatusClasses(this);

    if ( jobId() === this.jobId ) _class+= ' selected';

    return _class;
});

T.events({
    'click .link': function( event ) {
        jobId(this.jobId);
        viewType('job');
    },
});


/**
 * TEMPLATE mainNavigationUsers
 */
T.select('mainNavigationUsers');

var _getAllUserNames= SpongeTools.getCachedData('getAllUserNames', SpongeTools.TIMEOUT_SHORT);
var getAllUserNames= function() {
    return _getAllUserNames();
};

T.helper('users', function() {
    var userNames= getAllUserNames();
    if ( !userNames ) return;

    userNames.sort();

    return userNames.map(function( username ) { return { username: username }; });
});

T.helper('rowClass', function() {
    var _class= getStatusClasses(this);

    if ( SpongeTools.editUsername() === this.username ) _class+= ' selected';

    return _class;
});

T.events({
    'click .link.edit': function( event ) {
        SpongeTools.editUsername(this.username);
        viewType('user');
    },
    'click .link.new': function( event ) {
        SpongeTools.editUsername(' new user');
        viewType('user');
    },
});



/**
 * TEMPLATE mainRightContent
 */
T.select('mainRightContent');

T.helper('context', function() {
    switch ( viewType() ) {
        case 'model': return cleanObject(getModel(modelId()));
        case 'job': return cleanObject(getJob(jobId()));
        case 'user':
            var username= SpongeTools.editUsername();
            if ( !username ) return;

            var user= Meteor.users.findOne({ username: username }) || { username: username, profile: {} };
            return cleanObject(user);
    }
});

T.helper('content', function() {
    switch ( viewType() ) {
        case 'model': return Template.model;
        case 'job':   return Template.job;
        case 'user':  return Template.userEdit;
    }
    return null;
});


SpongeTools.viewType= viewType;
