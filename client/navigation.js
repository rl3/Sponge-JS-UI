
var getSort= function( key, order ) {
    if ( !arguments.length ) return Session.get('main-navigation-sort') || { key: 'name', order: 1, };
    Session.set('main-navigation-sort', { key: key, order: order });
};

Template.mainNavigationHeader.sortClassDate= function() {
    var sort= getSort();
    if ( sort.key !== 'date' ) return;

    return sort.order > 0 ? 'icon-arrow-up' : 'icon-arrow-down';
};

Template.mainNavigationHeader.sortClassName= function() {
    var sort= getSort();
    if ( sort.key !== 'name' ) return;

    return sort.order > 0 ? 'icon-arrow-up' : 'icon-arrow-down';
};

Template.mainNavigationHeader.events({
    'click a': function( event ) {
        var sortName= $(event.currentTarget).attr('sort');
        var sortOrder= 1;

        var oldSort= getSort();

        if ( oldSort.key === sortName ) {
            sortOrder= -oldSort.order;
        }
        getSort(sortName, sortOrder);
    }
});

var invalidateList= DataObjectTools.getInvalidator();

var _getJobs= DataObjectTools.getCachedData('getJobs', 2000);
var getJobs= function() {
    invalidateList();
    return _getJobs({});
};

var getModel= DataObjectTools.getCachedData('getModel');

var str2Oid= DataObjectTools.str2Oid;
var oid2Str= DataObjectTools.oid2Str;

Template.mainNavigationModels.models= function() {
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

    var sort= getSort();

    result.sort(function( a, b ) {
        return a[sort.key] < b[sort.key] ? sort.order : a[sort.key] > b[sort.key] ? -sort.order : 0;
    })

    return result;
};

Template.mainNavigationModels.date= function() {
    return DataObjectTools.valueToString(this.date);
};

Template.mainNavigationJobs.jobs= function() {
    var jobs= getJobs();
    if ( !jobs ) return;

    var result= jobs.map(function( job ) {
        return {
            id: job.jobId,
            name: (job.title || '') + (job.description || ''),
            title: job.title,
            description: job.description,
            date: job.timeStamp,
        }
    });

    var sort= getSort();

    result.sort(function( a, b ) {
        return a[sort.key] < b[sort.key] ? sort.order : a[sort.key] > b[sort.key] ? -sort.order : 0;
    })

    return result;
};

Template.mainNavigationJobs.date= function() {
    return DataObjectTools.valueToString(this.date);
};

