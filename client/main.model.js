
var getSchema= getCachedData('getSchemaByTypeVersion');

var objectArrayMapper= function( obj ) {
    return Object.keys(obj).map(function( key ) {
        var result= {
            name: key,
            type: obj[key],
        };
        return result;
    })
};

Template.model.functionBody= function() {
    var body= this.functionBody.code || '';
    var definition= this.definition;

    if ( !definition ) return;

    return {
        body: body,
        result: objectArrayMapper(definition.result),
        args: objectArrayMapper(definition.args),
    };
};

Template.model.isTemplate= function() {
    return this.className === 'de.atb_potsdam.agrohyd.model.ModelTemplate';
    return !('templateId' in this);
};

Template.model.timeStamp= function() {
    return DataObjectTools.formatValue(this.timeStamp, true);
}

Template.model.inputDefinitions= function() {
    var inputs= (this.inputDefinitions || {}).typeMap || {};
};

