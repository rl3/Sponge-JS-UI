
var getSchema= getCachedData('getSchemaByTypeVersion');

var fixType= function( className ) {
    return className.replace(/^de\.atb_potsdam\.agrohyd\.type\.Type/, '');
};

var fixTypeMap= function( typeMap ) {
    var result= {};
    for ( var name in typeMap ) {
        var args= [];
        var map= typeMap[name].args.typeMap;
        for ( var argName in map ) {
            args.push({
                name: argName,
                type: fixType(map[argName].className),
            });
        }
        result[name]= {
            result: fixType(typeMap[name].result.className),
            args: args,
        };
    }
    return result;
};

var getFunctionDefinitions= function( definitions ) {
    if ( definitions.typeMap ) return fixTypeMap(definitions.typeMap);

    var parts= definitions.typeSignature.split('::v', 2);
    var schema= getSchema({ type: parts[0], version: parts[1]});
    if ( !schema ) return;

    args= [];
    schema.iteratorType.forEach(function( it ) {
        args.push({
            name: it.argName,
            type: fixType(it.type.className),
            unit: it.type.unit,
            description: it.type.description,
        });
    });

    definitions= {};
    var map= schema.fixArgs.typeMap;
    for ( var name in map ) {
        definitions[name]= {
            args: args,
            result: fixType(schema.fixArgs.typeMap[name].className),
        };
    }
    return definitions;
};

Template.model.functionBodies= function() {
    var functionBodies= this.functionBodies;
    var definitions= getFunctionDefinitions(this.functionDefinitions);

    if ( !definitions ) return;

    return Object.keys(definitions).map(function( name ) {
        var body= (functionBodies[name] || {}).code || '';
        return {
            name: name,
            body: body,
            bodyEscaped: body.replace(/\&/g, '&amp;').replace(/\</g, '&lt;'),
            result: definitions[name].result,
            args: definitions[name].args,
        };
    });
};
