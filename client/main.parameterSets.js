
var SetsPerPage= 20;

var getSchema= getCachedData('getSchemaByTypeVersion');
var getParameterSetCount= getCachedData('getParameterSetCount');
var getParameterSetKeys= getCachedData('getParameterSets');

var sessionGet= function( name ) {
    return Session.get('parameterSet.' + name);
};

var injectPageNumber= function( context ) {
    if ( !context.pageNumber ) context.pageNumber= ReactiveValue(0);
    return context.pageNumber;
};

Template.parameterSets.pagination= function() {
    var setCount= getParameterSetCount(this._id);
    if ( !setCount ) return;

    var pageCount= Math.floor(setCount / SetsPerPage);
    if ( pageCount * SetsPerPage < setCount ) pageCount++;
    return new Handlebars.SafeString(Template.pagination({count: pageCount, pageNumber: injectPageNumber(this), }));
};

Template.parameterSets.schema= function() {
    var schema= getSchema({type: this.objectType, version: this.version});
    return schema;
};

var getValueHeaders= function( objectType, version ) {
    if ( !objectType || !version ) return;

    var schema= getSchema({type: objectType, version: version});
    if ( !schema ) return;

    var args= schema.fixArgs.typeMap;
    var result= Object.keys(args).map(function(name) {
        return {
            value: name,
            description: args[name].description,
            index: args[name].index,
            unit: args[name].unit,
            type: args[name].className,
            header: true,
        };
    });
    result.sort(function( a, b ) { return a.index - b.index; });
    result.unshift({
        value: 'Iterator',
        description: 'valid Range',
        index: -1,
        unit: schema.iteratorType.map(function( t ) {
            return t.argName + (t.type && t.type.unit ? ' in ' + t.type.unit : '');
        }).join(', '),
        iteratorType: schema.iteratorType,
        header: true,
    });
    return result;
};

var getSets= function( id, pageNumber ) {
    var sets= getParameterSetKeys({id: id, start: +pageNumber() * SetsPerPage, count: SetsPerPage});
    return sets;
};

var formatValue= function( value ) {
    if ( !value ) return;

    if ( 'value' in value ) {
        return {
            value: value.value,
            decscription: value.value,
        }
    }

    if ( 'fixFunction' in value ) {
        var ff= value.fixFunction;
        var args= (value.fixArgs || {}).values || {};
        return {
            value: ff._id + '()',
            description: ff._id + '(' + Object.keys(args).map(function( name ) {
                return name + '=' + args[name].value;
            }).join(', ') + ')',
        };
    }

    return {
        description: 'unknown value',
    };
};

var iteratorMapper= function( v ) {
    return v.value + (v.unit || '');
};

var iteratorDescriptionMapper= function( v ) {
    return v.name + '=' + iteratorMapper(v);
};

Template.parameterSets.setValues= function() {
    var valueHeaders= getValueHeaders(this.objectType, this.version);
    if ( !valueHeaders ) return;

    var rows= [ valueHeaders ];

    var sets= getSets(this._id, injectPageNumber(this));
    if ( !sets ) return;

    sets.forEach(function( set ) {
        rows.push(valueHeaders.map(function( header ) {
            if ( 'iteratorType' in header ) {
                var start= DataObjectTools.formatIteratorValues(set.start, header.iteratorType);
                var end= DataObjectTools.formatIteratorValues(set.end, header.iteratorType);
                var startValue= start ? start.map(iteratorMapper).join(', ') : '';
                var endValue= end ? end.map(iteratorMapper).join(', ') : '';
                var startDescr= start ? start.map(iteratorDescriptionMapper).join(', ') : '';
                var endDescr= end ? end.map(iteratorDescriptionMapper).join(', ') : '';
                return {
                    value: startValue + (startValue === endValue ? '' : (' to ' + endValue)),
                    description: startDescr + (startDescr === endDescr ? '' : (' to ' + endDescr)),
                    header: true,
                };
            }
            return formatValue(set.values[header.value]);
        }));
    });

    return rows;
};
