
var session= DataObjectTools.localSession('main-navigation');

var modelId= DataObjectTools.modelId;
var jobId= DataObjectTools.jobId;
var str2Oid= DataObjectTools.str2Oid;
var oid2Str= DataObjectTools.oid2Str;
var cleanObject= DataObjectTools.cleanObject;
var getInvalidator= DataObjectTools.getInvalidator;
var invalidateJob= DataObjectTools.invalidateJob;
var invalidateModel= DataObjectTools.invalidateModel;

var userName= function( username ) {
    if ( arguments.length ) return session('username', username);
    return session('username');
};

var T= DataObjectTools.Template;

T.select('mainHeader');

var buildHeader= function( title, object, property ) {

    var result= {
        main: title,
    };

    switch ( typeof object ) {
        case 'object':
            object= cleanObject(object);

            if ( object ) {
                if ( object._id ) result.addition= DataObjectTools.valueToString(str2Oid(object._id));
                var title= DataObjectTools.getProperty(object, property);
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

/**
 * TEMPLATE mainNavigationHeader
 */
T.select('mainNavigationHeader');

var getSort= function() {
    return session('sort') || { key: 'date', order: 1 };
};

var setSort= function( key, order ) {
    session('sort', { key: key, order: order });
}

T.helper('sortClassDate', function() {
    var sort= getSort();
    if ( sort.key !== 'date' ) return;

    return sort.order > 0 ? 'icon-arrow-up' : 'icon-arrow-down';
});

T.helper('sortClassName', function() {
    var sort= getSort();
    if ( sort.key !== 'name' ) return;

    return sort.order > 0 ? 'icon-arrow-up' : 'icon-arrow-down';
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
    }
});

var _getJobs= DataObjectTools.getCachedData('getJobs', 2000);
var getJobs= function( options ) {
    DataObjectTools.invalidateJobList();
    if ( !options ) options= {};
    if ( !session('allUsers') ) options.userId= getApiUserName();

    var jobs= _getJobs(options);
    return jobs;
};

var _getAllModels= DataObjectTools.getCachedData('getModels');
var getAllModels= function() {
    DataObjectTools.invalidateModelList();
    return _getAllModels({});
};

var _getModel= DataObjectTools.getCachedData('getModel');
var getModel= function( modelId ) {
    invalidateModel(modelId);
    return _getModel.apply(null, arguments);
};

var _getJob= DataObjectTools.getCachedData('getJob', 2000);
var getJob= function( jobId ) {
    invalidateJob(jobId);
    return _getJob.apply(null, arguments);
};

var getApiUserName= function() {
    var user= Meteor.user();
    if ( !user || !user.profile || !user.profile.agrohyd ) return;

    return user.profile.agrohyd.apiUser;
};


/**
 * TEMPLATE mainNavigationModels
 */
T.select('mainNavigationModels');

T.helper('switch', function() {
    if ( modelId() ) return 'unselect';

    return session('allUsers') ? 'my models' : 'all models';
});

var sortFn= function() {
    var sort= getSort();
    return function( a, b ) {
        if ( a[sort.key] < b[sort.key] ) return sort.order;
        if ( a[sort.key] > b[sort.key] ) return -sort.order;
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
        var time= job.timeStamp;
        if ( !(id in models) || time > models[id] ) {
            models[id]= time;
        }
    });
    var result= Object.keys(models).map(function( modelId ) {
        var model= getModel(modelId);
        return {
            id: modelId,
            name: model && model.name ? model.name : DataObjectTools.valueToString(str2Oid(modelId)),
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
    if ( this.date ) return DataObjectTools.dateToString(this.date);
});

T.helper('time', function() {
    if ( this.date ) return DataObjectTools.timeToString(this.date);
});

var commonListClass= function( getter ) {
    return function() {
        return getter() ? 'show-selected' : 'show-all';
    };
};

var commonRowClass= function( getter, normalize ) {
    if ( !normalize ) normalize= function( v ) { return v; };

    return ;
};

T.helper('listClass', commonListClass(modelId));
T.helper('rowClass', function() {
    if ( oid2Str(modelId()) === oid2Str(this.id) ) return 'selected';
});

T.events({
    'click a.switch': function( event ) {
        if ( modelId() ) return modelId(null);

        return session('allUsers', !session('allUsers'));
    },
    'click .link': function( event ) {
        modelId(this.id);
        session('view', 'model');
    },
});


/**
 * TEMPLATE mainNavigationJobs
 */
T.select('mainNavigationJobs');

T.helper('switch', function() {
    if ( jobId() ) return 'unselect';
});

T.helper('loading', function() {
    var jobs= getJobs({ modelId: modelId() });
    return jobs === undefined;
});

var jobsToWatch= {};

var jobWatchTimer= null;

var addJobWatchTimer= function( job ) {
    if ( !job.invalidator ) job.invalidator= getInvalidator();

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
            date: job.timeStamp,
            status: job.status,
        }
    });

    result.sort(sortFn());

    return result;
});

T.helper('listClass', commonListClass(jobId));

T.events({
    'click a.switch': function( event ) {
        if ( jobId() ) return jobId(null);
    },
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
    if ( this.date ) return DataObjectTools.dateToString(this.date);
});

T.helper('time', function() {
    if ( this.date ) return DataObjectTools.timeToString(this.date);
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

T.helper('switch', function() {
    if ( userName() ) return 'unselect';
});

T.helper('users', function() {
    return Meteor.users.find({}, { sort: [[ 'username', 'asc' ]] });
});

T.helper('listClass', commonListClass(userName));

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
    'click a.switch': function( event ) {
        if ( userName() ) return userName(null);
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
