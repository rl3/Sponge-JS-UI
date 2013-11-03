
var session= DataObjectTools.localSession('main-navigation');

var modelId= DataObjectTools.modelId;
var jobId= DataObjectTools.jobId;
var str2Oid= DataObjectTools.str2Oid;
var oid2Str= DataObjectTools.oid2Str;
var cleanObject= DataObjectTools.cleanObject;

var T= DataObjectTools.Template;

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

    return _getJobs(options);
};

var _getAllModels= DataObjectTools.getCachedData('getModels');
var getAllModels= function() {
    DataObjectTools.invalidateModelList();
    return _getAllModels({});
};

var getModel= DataObjectTools.getCachedData('getModel');
var getJob= DataObjectTools.getCachedData('getJob');

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
            name: model && model.name ? model.name : modelId,
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
    if ( this.date ) return DataObjectTools.valueToString(this.date);
});

var commonClasses= function( getter, normalize ) {
    if ( !normalize ) normalize= function( v ) { return v; };

    return function() {
        var classes= [];
        var id= getter();
        if ( normalize(id) === normalize(this.id) ) {
            classes.push('selected');
        }
        else if ( id ) classes.push('hidden');

        return classes.join(' ');
    };
};

T.helper('modelClasses', commonClasses(modelId, oid2Str));

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

T.helper('jobs', function() {
    var jobs= getJobs({ modelId: modelId() });
    if ( !jobs ) return;

    var result= jobs.map(function( job ) {
        return {
            id: job.jobId,
            name: (job.title || '') + (job.description || ''),
            title: job.title || '',
            description: job.description || '',
            date: job.timeStamp,
        }
    });

    result.sort(sortFn());

    return result;
});

T.helper('date', function() {
    if ( this.date ) return DataObjectTools.valueToString(this.date);
});

T.helper('title', function() {
    if ( this.description ) return this.description.title;
});

T.helper('description', function() {
    if ( this.description ) return this.description.text;
});

T.helper('jobClasses', commonClasses(jobId));

T.events({
    'click a.switch': function( event ) {
        if ( jobId() ) return jobId(null);
    },
    'click .link': function( event ) {
        jobId(this.id);
        session('view', 'job');
    },
});


/**
 * TEMPLATE mainRightContent
 */
T.select('mainRightContent');

var buildHeader= function( title, object, property ) {

    var result= {
        main: title,
    };

    object= cleanObject(object);

    if ( typeof object === 'object' ) {
        if ( object ) {
            if ( object._id ) result.addition= 'ObjectID(' + oid2Str(object._id)  + ')';
            var title= DataObjectTools.getProperty(object, property);
            if ( title ) result.title= title;
        }
        else {
            result.message= 'please select left';
        }
    }

    if ( object === undefined ) result.message= 'please wait...';

    return result;
};

T.helper('header', function() {
    switch ( session('view') ) {
        case 'model': return buildHeader('Model', getModel(modelId()), 'name');
        case 'job': return buildHeader('Job', getJob(jobId()), 'description.title');
    }
});

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
    }

    if ( !template || !context ) return;

    return new Handlebars.SafeString(template(context));
});
