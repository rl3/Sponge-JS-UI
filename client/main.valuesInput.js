
var T= SpongeTools.Template;

var injectVar= SpongeTools.injectVar;
var injectGlobalVar= SpongeTools.injectGlobalVar;

var options= {};
var onClose= undefined;
var values= undefined;

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
    for ( var name in values ) {
        if ( typeof values[name] === 'undefined' ) {
            return false;
        }
    }
    return true;
};

T.helper('values', function() {
    dialogInvalidator();
    return values;
});

T.helper('nameClass', function() {
    return this.info && this.info.optional ? 'optional' : 'mandatory';
});

T.events({
    'click a.editValue': function( event ) {
        if ( options.simple ) {
            SpongeTools.showSingleValueDialog({
                get: this.getValue,
                set: this.setValue,
                type: this.type,
            });
            return;
        }
        injectGlobalVar('valueInput')(this);
        SpongeTools.showModal($('#valueInput'));
    },
});

$(function() {
    $('body').on('click', '#valuesInput button.btn-primary', function() {

        var _values= parseValues();

        if ( !verifyValues(_values) ) {
            alert('You have to set all values');
            return;
        }

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
    values= _values;
    onClose= _onClose;
    options= _options || {};
    dialogInvalidator(true);
    SpongeTools.showModal($('#valuesInput'));
};
