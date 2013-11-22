
Template.editValue.events({
    'click a': function( event ) {
        SpongeTools.injectGlobalVar('valueInput')(this);
        SpongeTools.showModal($('#valueInput'));
        return false;
    },
});
