
var getSchema= getCachedData('getSchemaByTypeVersion');
var getAgroObject= getCachedData('getAgroObject');

Template.dataObject.dataObject= function( objectId ) {
    return getAgroObject(objectId);
};

var getType= function( data ) {
    if ( !data || !data.className ) {
        switch ( typeof data ) {
        case 'number': return 'Double';
        case 'string': return 'String';
        case 'object':
            if ( data.__date instanceof Date ) return 'Date';
        }
        return 'Unknown';
    }
    var parts= data.className.split('.');
    var type= parts.pop();
    return type.replace(/^ParameterValue/, '');
}

Template.dataObject.getType= getType;

var format= function( data ) {
    switch ( getType(data) ) {
    case 'Date': return new Date(data.value.__date).toGMTString();
    default: return data.value;
    }
};

Template.dataObject.format= format;

Template.dataObject.iteratorValues= function( values ) {
    if ( !values ) return;

    var schema= getSchema({type: this.objectType, version: this.version});

    if ( !schema || !schema.iteratorType ) return;

    if ( !Array.isArray(values) ) {
        var _values= {};
        _values[schema.iteratorType[0].argName]= values;
        values= _values;
    }

    var result= schema.iteratorType.map(function( it, i ) {
        return {
            index: i,
            name: it.argName,
            unit: it.type.unit,
            value: format(values[it.argName]),
        }
    });
    return result;

};

