
var T= SpongeTools.Template;

/**
 * Template job
 */
T.select('editValue');

T.events({
    'click a': function( event ) {
        SpongeTools.injectGlobalVar('valueInput')(this.value);
        SpongeTools.Modal.show($('#valueInput'));
        return false;
    },
});
