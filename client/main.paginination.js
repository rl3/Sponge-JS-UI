

Template.pagination.visible= function() {
    return this.count > 1;
};

var buildPageVar= function( context ) {
    if ( context.pageVar ) return context.pageVar;

    var set, get;
    if ( context.sessionName ) {
        var sessionName= context.sessionName;
        return function( value ) {
            return arguments.length ? Session.set(sessionName, value) : Session.get(sessionName);
        };
    }

    context.pageVar= context.pageNumber || DataObjectTools.ReactiveValue(0);
    return context.pageVar;
};

Template.pagination.pages= function() {
    var count= this.count;
    var page= buildPageVar(this);
    var activePage= page();
    var pages= [];
    for ( var i= 0; i < count; i++ ) {
        pages.push({
            num: i,
            title: i + 1,
            active: i == activePage,
            page: page,
        });
    }
    return pages;
};

Template.pagination.isFirstPage= function() {
    return buildPageVar(this)() < 1;
};

Template.pagination.isLastPage= function() {
    return buildPageVar(this)() >= this.count - 1;
};

Template.dataObjects.events({
    'click .pagination a.page': function( event ) {
        this.page(this.num);
    },
    'click .pagination a.back': function( event ) {
        var page= buildPageVar(this);
        page(Math.max(0, +page() - 1))
    },
    'click .pagination a.next': function( event ) {
        var page= buildPageVar(this);
        page(Math.min(this.count - 1, +page() + 1))
    },
});
