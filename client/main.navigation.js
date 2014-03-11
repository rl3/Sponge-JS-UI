
var session= SpongeTools.localSession('main-navigation');

var modelId= SpongeTools.modelId;
var jobId= SpongeTools.jobId;
var str2Oid= SpongeTools.str2Oid;
var oid2Str= SpongeTools.oid2Str;
var cleanObject= SpongeTools.cleanObject;
var getInvalidator= SpongeTools.getInvalidator;
var invalidateJob= SpongeTools.invalidateJob;
var invalidateModel= SpongeTools.invalidateModel;

var userName= function( username ) {
    if ( arguments.length ) return session('username', username);
    return session('username');
};

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
    switch ( session('view') ) {
        case 'model': return buildHeader('Model', getModel(modelId()), 'name');
        case 'job': return buildHeader('Job', getJob(jobId()), 'description.title');
        case 'user': return buildHeader('User Management', userName());
    }
});

T.select('mainNavigation');

T.addFn('rendered', function() {
    $(this.find('.accordion')).find('.collapse').collapse({ toggle: false, });
    switch (session('view') || 'model' ) {
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
    return session('sort') || { key: 'date', order: 1 };
};

var setSort= function( key, order ) {
    session('sort', { key: key, order: order });
};

var sortChar= function( order ) {
    return new Handlebars.SafeString(order > 0 ? '&#9660;' : '&#9650;');
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
    return session('allUsers') ? 'btn-primary' : '';
});

T.helper('switchMy', function() {
    return session('allUsers') ? '' : 'btn-primary';
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
        session('allUsers', !session('allUsers'));
        return false;
    },
});

var _getJobs= SpongeTools.getCachedData('getJobs', 2000);
var getJobs= function( options ) {
    SpongeTools.invalidateJobList();
    if ( !options ) options= {};
    if ( !session('allUsers') ) options.userId= getApiUserName();

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

var _getJob= SpongeTools.getCachedData('getJob', 2000);
var getJob= function( jobId ) {
    invalidateJob(jobId);
    return _getJob.apply(null, arguments);
};

var getApiUserName= function() {
    var user= Meteor.user();
    if ( !user || !user.profile || !user.profile.agrohyd ) return;

    return user.profile.agrohyd.apiUser;
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
    if ( session('allUsers') ) {
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
        session('view', 'model');
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

var addJobWatchTimer= function( job ) {
    if ( !job.invalidator ) job.invalidator= getInvalidator('jobWatch' + job.jobId);

    job.invalidator();

    jobsToWatch[job.jobId]= job.invalidator;

    if ( !jobWatchTimer ) jobWatchTimer= setTimeout(jobTimer, 2000);
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
        clearTimeout(jobWatchTimer);
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
        session('view', 'job');
    },
});


/**
 * TEMPLATE mainNavigationUsers
 */
T.select('mainNavigationUsers');

T.helper('users', function() {
    return Meteor.users.find({}, { sort: [[ 'username', 'asc' ]] });
});

T.helper('rowClass', function() {
    var _class= getStatusClasses(this);

    if ( userName() === this.username ) _class+= ' selected';

    return _class;
});

T.events({
    'click .link.edit': function( event ) {
        userName(this.username);
        session('view', 'user');
    },
    'click .link.new': function( event ) {
        userName(' new user');
        session('view', 'user');
    },
});



/**
 * TEMPLATE mainRightContent
 */
T.select('mainRightContent');

T.helper('content', function() {
    var template;
    switch ( session('view') ) {
        case 'model':
            template= Template.model;
            context= cleanObject(getModel(modelId()));
            break;
        case 'job':
            template= Template.job;
            context= cleanObject(getJob(jobId()));
            break;
        case 'user':
            template= Template.userEdit;
            var username= userName();
            if ( !username ) return;

            var user= Meteor.users.findOne({ username: username }) || { username: username, profile: {} };
            context= cleanObject(user);
            break;
    }

    if ( !template || !context ) return;

    return new Handlebars.SafeString(template(context));
});
