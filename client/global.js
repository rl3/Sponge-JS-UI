
var session= DataObjectTools.localSession('global');

Handlebars.registerHelper('advancedView', function() {
    return DataObjectTools.advancedView();
});

DataObjectTools.advancedView= function( value ) {
    if ( arguments.length ) session('advancedView', value);
    return session('advancedView');
};

DataObjectTools.editor= function( onChange ) {
    return function( context, property ) {
        return new Handlebars.SafeString(Template.edit(
            new GuiTools.Edit({
                get: function() { return context[property]; },
                set: function( newValue ) {
                    context[property]= newValue;
                    if ( onChange ) onChange(context, property);
                },
            })
        ));
    }
};

