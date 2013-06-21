
Template.jsEditor.rendered= function() {
    var $editor= $(this.find('.js-editor'));
    var editor= ace.edit(this.find('.js-editor'));
//    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setValue(this.data.body);
}
