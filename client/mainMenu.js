
var menuItems= {};
var menuTabs= [];

var uniqueId= 0;

Handlebars.registerHelper("UniqueId", function( oldContext ) {
    if ( typeof oldContext !== 'object' ) {
        oldContext= {};
    }
    oldContext.__id= uniqueId++;
    return oldContext;
});

Handlebars.registerHelper("ReactiveValue", function( oldContext, initValue ) {
    if ( typeof oldContext !== 'object' ) {
        oldContext= {};
    }
    oldContext.__value= ReactiveValue(initValue);
    return oldContext;
});

var instanceCounter= 0;

var addMenuItem= function(id, title, content) {
    id= 'menuItemId-' + id;
    var item= {
        id: id,
        title: title,
        content: content,
    };
    menuItems[id]= item;
    menuTabs.push(item);
}

addMenuItem("dataObjects", "DataObjects", function() {
    return new Handlebars.SafeString(Template.dataObjects());
});

addMenuItem("modelTemplates", "ModelTemplates", function() {
    return new Handlebars.SafeString(Template.models({ type: 'ModelTemplate' }));
});

addMenuItem("models", "Models", function() {
    return new Handlebars.SafeString(Template.models({ type: 'Model' }));
});

Template.main.created= function() {
}

Template.main.menuItems= function() {
    var sessionName= 'mainMenuTab-' + this.__id;
    return menuTabs.map(function( item ) {
        return {
            id: item.id,
            title: item.title,
            content: item.content,
            sessionName: sessionName,
        };
    });
}

Template.main.events({
    'click ul.nav-tabs a': function(event) {
        Session.set(this.sessionName, this.id);
        return true;
    },
});

Template.main.active= function(tabName) {
    return Session.equals(this.sessionName, tabName) ? 'active' : '';
}

Template.main.enabled= function(tabName) {
    return Session.equals(this.sessionName, tabName);
}

Template.main.menuContent=function(tabName) {
    var item= menuItems[tabName];
    if (!item) return;

    return typeof item.content === 'function' ? item.content() : item.content;
};

