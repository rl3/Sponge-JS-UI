
var ItemsPerPage= 50;

var injectVar= function( context, name, initValue ) {
    if ( !context.modelData ) context.modelData= {};
    if ( !context.modelData[name] ) context.modelData[name]= ReactiveValue(initValue)

    return context.modelData[name];
}

var getModelIds= {
    Model: getCachedData('getModelIds'),
    ModelTemplate: getCachedData('getModelTemplateIds'),
};

var getModel= {
    Model: getCachedData('getModel'),
    ModelTemplate: getCachedData('getModelTemplate'),
};

Template.models.pagination= function() {
    var modelIds= getModelIds[this.type]();
    if ( !modelIds ) return;

    var count= Math.floor(modelIds.length / ItemsPerPage);
    if ( count * ItemsPerPage < modelIds.length ) count++;

    return new Handlebars.SafeString(Template.pagination({count: count, pageNumber: injectVar(this, 'pageNumber', 0), }));
};

Template.models.modelIds= function() {
    var modelIds= getModelIds[this.type]();
    if ( !modelIds ) return;

    var activeFn= injectVar(this, 'modelId');

    return modelIds.slice(injectVar(this, 'pageNumber', 0)() * ItemsPerPage, ItemsPerPage).map(function( id ) {
        return {
            id: id,
            activateFn: activeFn,
            active: function() { return activeFn() === id },
        };
    });
};

Template.models.currentModelId= function() {
    return injectVar(this, 'modelId')();
};

Template.models.currentModel= function() {
    var id= injectVar(this, 'modelId')();
    return getModel[this.type](id);
};

Template.models.events({
    'click .modelId a': function(event) {
        this.activateFn(this.id)
    }
});
