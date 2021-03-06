'use strict';

var T= SpongeTools.Template;

var ReactiveValue= SpongeTools.ReactiveValue;

var callFn= function( fn ) {
    return typeof fn === 'function' ? fn.apply(null, Array.prototype.slice.call(arguments, 1)) : null;
}

T.select('wizardBody');

var states= [];
var state= function( step, value ) {
    if ( !states[step] ) {
        states[step]= ReactiveValue(value);
        return value;
    }

    if ( arguments.length === 1 ) return states[step]();

    return states[step](value);
}

var newStep= function( nextStep, newDataFn ) {
    var newData= callFn(newDataFn) || {};
    state(nextStep, 'open');
    callFn(newData.onFinished, function() {
        state(nextStep, callFn(newData.isFinished) ? 'closed' : 'open');
    });
    return {
        wizardData: newData || {},
        step: nextStep,
    };
}

T.helper('firstStepData', function() {
    states= [];
    return newStep(0, this.firstStepData);
});


T.select('wizardStep');

T.helper('enabled', function() {
    return this.wizardData.isEnabled ? this.wizardData.isEnabled() : true;
});

T.helper('isOpen', function() {
    return state(this.step) === 'open';
});

T.helper('content', function() {
    var templateName= callFn(this.wizardData.getContentTemplate);
    if ( templateName in Template ) return Template[templateName];
    return null;
});

T.helper('contentCompressed', function() {
    var templateName= callFn(this.wizardData.getContentCompressedTemplate);
    if ( templateName in Template ) return Template[templateName];
    return null;
});

T.helper('nextAllowed', function() {
    return this.wizardData && callFn(this.wizardData.nextAllowed);
});

T.helper('nextStep', function() {
    return this.wizardData ? Template.wizardStep : null;
    return this.wizardData && callFn(this.wizardData.hasNext) ? Template.wizardStep : null;
});

T.helper('nextStepData', function() {
    return (callFn(this.wizardData.isFinished) || !callFn(this.wizardData.isEnabled)) && callFn(this.wizardData.hasNext) ? newStep(this.step + 1, this.wizardData.nextStepData) : undefined;
});

T.events({
    'click button.edit-step': function( event ) {
        state(this.step, 'open');
    },
    'click button.next': function() {
        callFn(this.wizardData.finish);
    },
});
