
var SetsPerPage= 20;

var getSchema= getCachedData('getSchemaByTypeVersion');
var getParameterSetCount= getCachedData('getParameterSetCount');
var getParameterSetKeys= getCachedData('getParameterSets');

var sessionGet= function( name ) {
    return Session.get('parameterSet.' + name);
};

Template.parameterSets.created= function() {
    Session.set('parameterSet.page', 0);
}

Template.parameterSets.pagination= function() {
    var setCount= getParameterSetCount(this._id);
    if ( !setCount ) return;

    var pageCount= Math.floor(setCount / SetsPerPage);
    if ( pageCount * SetsPerPage < setCount ) pageCount++;
    return new Handlebars.SafeString(Template.pagination({count: pageCount, sessionName: 'parameterSet.page'}));
};

Template.parameterSets.schema= function() {
    var schema= getSchema({type: this.objectType, version: this.version});
    return schema;
};

Template.parameterSets.values= function() {
    if ( !this.objectType || !this.version ) return;

    var schema= getSchema({type: this.objectType, version: this.version});
    if ( !schema ) return;

    var args= schema.fixArgs.typeMap;
    var result= Object.keys(args).map(function(name) {
        return {
            name: name,
            description: args[name].description,
            index: args[name].index,
            unit: args[name].unit,
            type: args[name].className,
        };
    });
    result.sort(function( a, b ) { return a.index - b.index; });
    return result;
};

Template.parameterSets.sets= function( id ) {
    var sets= getParameterSetKeys({id: id, start: +sessionGet('page') * SetsPerPage, count: SetsPerPage});
    return sets;
};

Template.parameterSets.value= function( name ) {
console.log(v)
    var v= this.values[name];
    if ( !v ) return;

    if ( 'value' in v ) return v.value;

    if ( 'fixFunction' in v ) {
        var ff= v.fixFunction;
        var args= (v.fixArgs || {}).values || {};
        return ff._id + '(' + Object.keys(args).map(function( name ) {
            return name + '=' + args[name].value;
        }).join(', ') + ')';
    }

    return 'unknown';
};
