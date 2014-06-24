
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

var globalVars= {};

var injectGlobalVar= function( name, initValue ) {
    return injectVar(globalVars, name, initValue);
};

var getInvalidator= function( name ) {
    if ( !name ) name= '(unknown)';
    var dependency= new Deps.Dependency();
    return function( invalidate ) {
//        if ( invalidate ) console.log('invalidate', name);
        if ( invalidate ) return dependency.changed();
        return dependency.depend();
    };
};

var getObjectInvalidator= function( name ) {
    var context= {};
    return function( id, invalidate ) {
        if ( !(id in context) ) context[id]= getInvalidator(name + '.' + id);
        context[id](invalidate);
    };
};

SpongeTools.ReactiveValue= ReactiveValue;
SpongeTools.injectVar= injectVar;
SpongeTools.injectGlobalVar= injectGlobalVar;
SpongeTools.getInvalidator= getInvalidator;
SpongeTools.getObjectInvalidator= getObjectInvalidator;

SpongeTools.invalidateJobList= getInvalidator('job list');
SpongeTools.invalidateJobQueue= getInvalidator('job queue');
SpongeTools.invalidateModelList= getInvalidator('model list');

SpongeTools.invalidateJob= getObjectInvalidator('job');
SpongeTools.invalidateModel= getObjectInvalidator('model');

SpongeTools.shareObject= injectGlobalVar('shareObject', {});

