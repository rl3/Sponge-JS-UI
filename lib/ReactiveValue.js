
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
    if ( !context._meta ) context._meta= {};
    if ( !context._meta[name] ) context._meta[name]= ReactiveValue(initValue)

    return context._meta[name];
};

DataObjectTools.ReactiveValue= ReactiveValue;
DataObjectTools.injectVar= injectVar;