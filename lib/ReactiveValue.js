
var ReactiveValue= function( value ) {
    var dependency= new Deps.Dependency

    return function( newValue ) {
        if ( !arguments.length ) {
            dependency.depend();
            return value;
        }

        if ( value === newValue || _.isEqual(value, newValue) ) {
            return value;
        }

        value= newValue;
        dependency.changed();
        return value;
    }
};

var injectVar= function( context, name, initValue ) {
    if ( context.__proto__ === Object.prototype ) {
        context.__proto__= {
            _meta: {},
        };
    }
    else if ( !context._meta ) context._meta= {};

    var meta= context._meta;
    if ( !(name in meta) ) {
        meta[name]= ReactiveValue(initValue);
    }
    return meta[name];
};

var injectGlobalVar= function( name, initValue ) {
    return injectVar(DataObjectTools, name, initValue);
};

var getInvalidator= function() {
    var counter= 0;
    var value= injectVar({}, 'invalidate', counter);
    return function( invalidate ) {
        return invalidate ? value(++counter) : value();
    };
};

DataObjectTools.ReactiveValue= ReactiveValue;
DataObjectTools.injectVar= injectVar;
DataObjectTools.injectGlobalVar= injectGlobalVar;
DataObjectTools.getInvalidator= getInvalidator;
