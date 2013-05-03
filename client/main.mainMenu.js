
var mainMenu= new Nav();

var contentFn= function(title) {
    return "Der Content von " + title;
}

mainMenu.addTemplate('DataObjects', "dataObjects");
mainMenu.add('Zwei', contentFn, "two");
mainMenu.add('Drei', contentFn, "three");
mainMenu.add('Vier', contentFn, "four");

Template.main.mainNav= function() {
    if (mainMenu) return mainMenu.tabs;
};

Template.main.mainNav= function() {
    if (mainMenu) return mainMenu.tabs;
};

