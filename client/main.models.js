
var ItemsPerPage= 50;

var injectVar= DataObjectTools.injectVar;

var getModelNames= {
    Model: getCachedData('getModelNames'),
    ModelTemplate: getCachedData('getModelTemplateNames'),
};

var getModel= {
    Model: getCachedData('getModel'),
    ModelTemplate: getCachedData('getModelTemplate'),
};

Template.models.pagination= function() {
    var modelNames= getModelNames[this.type]();
    if ( !modelNames ) return;

    var count= Math.floor(modelNames.length / ItemsPerPage);
    if ( count * ItemsPerPage < modelNames.length ) count++;

    return new Handlebars.SafeString(Template.pagination({count: count, pageNumber: injectVar(this, 'pageNumber', 0), }));
};

Template.models.modelNames= function() {
    var modelNames= getModelNames[this.type]();
    if ( !modelNames ) return;

    var activeFn= injectVar(this, 'modelId');

    return modelNames.slice(injectVar(this, 'pageNumber', 0)() * ItemsPerPage, ItemsPerPage).map(function( model ) {
        return {
            id: model._id,
            name: model.name,
            activateFn: activeFn,
            active: function() { return activeFn() === model._id },
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
