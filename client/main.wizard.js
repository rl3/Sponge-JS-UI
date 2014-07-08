
var T= SpongeTools.Template;

var ReaktiveValue= SpongeTools.ReactiveValue;

var CallFn= function( fn ) {
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
        state(nextStep, CallFn(newData.isFinished) ? 'closed' : 'open');
    });
    return {
        data: newData || {},
        step: nextStep,
    };
}

T.helper('firstStepData', function() {
    states= [];
    return newStep(0, this.firstStepData);
});


T.select('wizardStep');

T.helper('isOpen', function() {
    return state(this.step) === 'open';
});

T.helper('content', function() {
    return CallFn(this.data.getContentTemplate);
});

T.helper('contentCompressed', function() {
    return CallFn(this.data.getContentCompressedTemplate);
});

T.helper('data', function() {
    return CallFn(this.data.getData) || {};
});

T.helper('nextStep', function() {
    return CallFn(this.data.isFinished) && callFn(this.data.hasNext) ? 'wizardStep' : null;
});

T.helper('nextStepData', function() {
    return newStep(this.step + 1, this.data.nextStepData);
});
