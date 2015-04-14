
var injectVar= SpongeTools.injectVar;

Template.jsEditor.onRendered(function() {
    var data= this.data;
    var $editor= this.$('.js-editor');
    var editor= ace.edit(this.find('.js-editor'));
    data._editor= editor;
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/javascript");
    editor.getSession().setTabSize(4);
    editor.getSession().setUseSoftTabs(true);
    editor.setValue(data.getValue());
    if ( data.setValue ) {
        var self= this;
        editor.on('change', function() {
            $(self.find('i.icon-ok')).removeClass('icon-white');
        });
    }
    editor.setReadOnly( !data.setValue );
    editor.navigateFileStart();
    if ( data.onFocus ) {
        editor.on('focus', data.onFocus);
    }
});

Template.jsEditor.hasChanged= function() {
    return injectVar(this, 'hasChanged')();
};

Template.jsEditor.events({
    'click i.icon-remove': function() {
        if ( this.onClose ) this.onClose();
    },
    'click i.icon-ok': function() {
        if ( this.setValue ) this.setValue(this._editor.getValue());
        if ( this.onClose ) this.onClose();
    }
});
