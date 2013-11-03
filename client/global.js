
var session= DataObjectTools.localSession('global');

Handlebars.registerHelper('advancedView', function() {
    return DataObjectTools.advancedView();
});

DataObjectTools.advancedView= function( value ) {
    if ( arguments.length ) session('advancedView', value);
    return session('advancedView');
};

