
var ReactiveValue= function( value ) {
    var dependency= new Deps.Dependency

    return function( newValue ) {
        if ( !arguments.length ) {
            dependency.depend();
            return value;
        }

        if ( value === newValue || _.isEqual(value, newValue) ) {
console.log('ReactiveValue: equal', value, newValue)
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
}

DataObjectTools.ReactiveValue= ReactiveValue;
DataObjectTools.injectVar= injectVar;
