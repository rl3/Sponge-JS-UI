
var getSchema= getCachedData('getSchemaByTypeVersion');
var getAgroObject= getCachedData('getAgroObject');

Template.dataObject.dataObject= function( objectId ) {
    return getAgroObject(objectId);
};

Template.dataObject.getType= DataObjectTools.getType;

Template.dataObject.format= DataObjectTools.formatValue;

Template.dataObject.iteratorValues= function( values ) {
    if ( !values ) return;

    var schema= getSchema({type: this.objectType, version: this.version});

    if ( !schema || !schema.iteratorType ) return;

    return DataObjectTools.formatIteratorValues( values, schema.iteratorType );
};

Template.dataObject.editDescription= function() {
    return new GuiTools.Edit(this, 'description');
}