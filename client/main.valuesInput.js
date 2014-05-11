
var T= SpongeTools.Template;

var injectVar= SpongeTools.injectVar;
var injectGlobalVar= SpongeTools.injectGlobalVar;

var options= {};
var onClose= undefined;
var values= undefined;
var errorMessages= SpongeTools.ReactiveValue([]);

var dialogInvalidator= SpongeTools.getInvalidator('valuesInputDialog');

T.select('valuesInputTitle');

T.helper('title', function() {
    dialogInvalidator();
    return options.title;
});

T.select('valuesInputBody');

var parseValues= function() {
    if ( !values ) return values;

    var result= {};
    values.forEach(function( v ) {
        var value= v.getValue();

        // skip all undefined optional args
        if ( value === undefined && v.info.optional ) return;

        result[v.name]= value;
    });
    return result;
};


var verifyValues= function( values ) {
    var result= [];
    for ( var name in values ) {
        if ( typeof values[name] === 'undefined' ) {
            result.push('Value for "' + name + '" is mandatory');
        }
    }
    return result;
};

T.helper('values', function() {
    dialogInvalidator();
    return values;
});

T.helper('nameClass', function() {
    return this.info && this.info.optional ? 'optional' : 'mandatory';
});

T.helper('topTemplate', function() {
    return options.topTemplate || null;
});
T.helper('topTemplateContext', function() {
    return options.topTemplateContext;
});

T.helper('bottomTemplate', function() {
    return options.bottomTemplate || null;
});
T.helper('bottomTemplateContext', function() {
    return options.bottomTemplateContext;
});

T.helper('errorMessages', function() {
    return errorMessages();
});

T.events({
    'click a.editValue': function( event ) {
        if ( options.simple ) {
            SpongeTools.showSingleValueDialog({
                get: this.getValue,
                set: this.setValue,
                type: this.type,
                info: this.info,
            });
            return;
        }
        injectGlobalVar('valueInput')(this);
        SpongeTools.Modal.show($('#valueInput'));
    },
});

$(function() {
    $('body').on('click', '#valuesInput button.btn-primary', function() {

        var _values= parseValues();

        var _errorMessages= verifyValues(_values);
        if ( options.validate ) _errorMessages= _errorMessages.concat(options.validate(_values) || []);

        errorMessages(_errorMessages);

        if ( _errorMessages.length ) return;

        $('#valuesInput').modal('hide');

        var _onClose= onClose;
        onClose= undefined;

        if ( _onClose ) _onClose(_values);
        return false;
    });
});


SpongeTools.valuesInput= function( _values, _options, _onClose ) {
    if ( !_onClose ) {
        _onClose= _options;
        _options= {};
    }
    errorMessages([]);
    values= _values;
    onClose= _onClose;
    options= _options || {};
    dialogInvalidator(true);
    SpongeTools.Modal.show($('#valuesInput'));
};
