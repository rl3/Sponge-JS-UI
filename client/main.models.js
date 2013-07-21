
var ItemsPerPage= 50;

var injectVar= DataObjectTools.injectVar;

var getModelNames= {
    Model: DataObjectTools.getCachedData('getModelNames'),
    ModelTemplate: DataObjectTools.getCachedData('getModelTemplateNames'),
};

var getModel= {
    Model: DataObjectTools.getCachedData('getModel'),
    ModelTemplate: DataObjectTools.getCachedData('getModelTemplate'),
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

    return modelNames.slice(injectVar(this, 'pageNumber', 0)() * ItemsPerPage, ItemsPerPage).map(function( model ) {
        return {
            id: model._id,
            name: model.name,
            active: function() {
                return _.isEqual(DataObjectTools.modelId(), model._id);
            },
        };
    });
};

Template.models.currentModelId= function() {
    return DataObjectTools.modelId();
}

Template.models.currentModel= function() {
    var id= DataObjectTools.modelId();
    return getModel[this.type](id);
};

Template.models.events({
    'click .modelId a': function( event ) {
        DataObjectTools.modelId(this.id);
    }
});
