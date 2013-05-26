
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

    var values= (schema.definition || {}).result || {};
    var valuesInfo= ((schema.definition || {}).info || {}).result || {};
    var result= schema.resultOrder.map(function( name, i ) {
        return {
            value: name,
            description: (valuesInfo[name] || {}).description,
            unit: (valuesInfo[name] || {}).unit,
            type: values[name],
            index: i,
            header: true,
        };
    });
    var args= (schema.definition || {}).args || {};
    var argsInfo= ((schema.definition || {}).info || {}).args || {};
    result.unshift({
        value: 'Iterator',
        description: 'valid Range',
        index: -1,
        unit: Object.keys(args).map(function( name ) {
            return name + (argsInfo[name] && argsInfo[name].unit ? ' in ' + argsInfo[name].unit : '');
        }).join(', '),
        schema: schema,
        header: true,
    });
    return result;
};

var getSets= function( id, pageNumber ) {
    var sets= getParameterSetKeys({id: id, start: +pageNumber() * SetsPerPage, count: SetsPerPage});
    return sets;
};

var formatValue= function( value, headerData ) {
    if ( !value ) return;

    if ( typeof value !== 'object' ) {
        return {
            value: value,
            description: headerData.description,
        };
    }

    if ( 'fixFunction' in value ) {
console.log(value)
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
            if ( 'schema' in header ) {
                var start= DataObjectTools.formatIteratorValues(set.start, header.schema);
                var end= DataObjectTools.formatIteratorValues(set.end, header.schema);
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
            return formatValue(set.values[header.value], header);
        }));
    });

    return rows;
};
