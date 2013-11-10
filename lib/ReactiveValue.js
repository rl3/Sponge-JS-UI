
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

var getInvalidator= function( name ) {
    var counter= 0;
    var value= injectVar({}, 'invalidate', counter);
    return function( invalidate ) {
        if ( invalidate ) console.log('invalidate', name);
        return invalidate ? value(++counter) : value();
    };
};

var getObjectInvalidator= function( name ) {
    var context= {};
    return function( id, invalidate ) {
        var value= injectVar(context, String(id), 0);
        var _value= value();
        if ( invalidate ) console.log('invalidate', name, id);
        return invalidate ? value(_value + 1) : _value;
    };
};

DataObjectTools.ReactiveValue= ReactiveValue;
DataObjectTools.injectVar= injectVar;
DataObjectTools.injectGlobalVar= injectGlobalVar;
DataObjectTools.getInvalidator= getInvalidator;

DataObjectTools.invalidateJobList= getInvalidator('job list');
DataObjectTools.invalidateModelList= getInvalidator('model list');

DataObjectTools.invalidateJob= getObjectInvalidator('job');
DataObjectTools.invalidateModel= getObjectInvalidator('model');

