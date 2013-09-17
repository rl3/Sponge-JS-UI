
Template.editValue.events({
    'click a': function( event ) {
        DataObjectTools.injectGlobalVar('valueInput')(this);
        DataObjectTools.showModal($('#valueInput'));
        return false;
    },
});
