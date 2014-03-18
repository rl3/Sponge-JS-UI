
var T= SpongeTools.Template;

T.select('valueInfo');

T.helper('infoNotEmpty', function() {
    return this && (this.unit || this.description);
});

T.helper('infoText', function() {
    var result= [];

    if ( this.unit ) result.push('[' + this.unit + ']');

    if ( this.description ) result.push(this.description.replace(/\n/g, '<br />'));

    return result.join('<br />');
});

T.addFn('rendered', function() {
    $(this.find('a')).tooltip({
        placement: 'right',
        html: true,
    });
});
