
var menuItems= {};
var menuTabs= [];

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

addMenuItem("tab2", "Tab 2", "tab 2");

Template.main.menu= function() {
    return menuTabs;
}

Template.main.events({
    'click ul.nav-tabs a': function(event) {
        Session.set('mainMenuTab', this.id);
        return true;
    },
});

var selectedTab= function() {
    return Session.get('mainMenuTab');
}

Template.main.active= function(tabName) {
    return selectedTab() === tabName ? 'active' : '';
}

Template.main.enabled= function(tabName) {
    return selectedTab() === tabName;
}

Template.main.menuContent=function(tabName) {
    var item= menuItems[tabName];
    if (!item) return;

    return typeof item.content === 'function' ? item.content() : item.content;
};

