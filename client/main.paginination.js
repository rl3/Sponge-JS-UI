

Template.pagination.visible= function() {
    return this.count > 1;
};

Template.pagination.pages= function() {
    var count= this.count;
    var activePage= Session.get(this.sessionName)
    var pages= [];
    for ( var i= 0; i < count; i++ ) {
        pages.push({
            num: i,
            title: i + 1,
            active: i == activePage,
            sessionName: this.sessionName,
        });
    }
    return pages;
};

Template.pagination.isFirstPage= function() {
    return Session.get(this.sessionName) < 1;
};

Template.pagination.isLastPage= function() {
    return Session.get(this.sessionName) >= this.count - 1;
};

Template.pagination.activePageClass= function() {
    return Session.get(this.sessionName) < 2;
};

Template.dataObjects.events({
    'click .pagination a.page': function( event ) {
        Session.set(this.sessionName, this.num);
    },
    'click .pagination a.back': function( event ) {
        Session.set(this.sessionName, Math.max(0, +Session.get(this.sessionName) - 1));
    },
    'click .pagination a.next': function( event ) {
        Session.set(this.sessionName, Math.min(this.count - 1, +Session.get(this.sessionName) + 1));
    },
});
