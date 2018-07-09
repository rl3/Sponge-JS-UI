'use strict';

var T= SpongeTools.Template;

var globalAceId= 'ace-editor';
var globalAceContainerId= 'ace-editor-dialog';
var globalAceEditor;

var get$container= (function() {
    var $container;
    return function() {
        if ( !$container ) $container= $('#' + globalAceContainerId);
        return $container;
    };
})();

var initEditor= function( id, options ) {
    var editor= ace.edit(id, _.extend({
        mode: 'ace/mode/javascript',
        selectionStyle: 'text',
    }, options || {}));
    return editor;
};

var setOptions= function( aceEditor ) {
    var session= aceEditor.session;
    aceEditor.clearSelection();
};

var show= function( content, cb ) {
    if ( !globalAceEditor ) {
        globalAceEditor= initEditor(globalAceId);
    }

    globalAceEditor.session.setValue(content || '');
    setOptions(globalAceEditor);

    SpongeTools.Modal.show(get$container(), function() {
    });
};

T.select('aceEditor')
var aceId= 0;

T.call('onCreated', function() {
    this._ace= {
        id: 'ace-editor-' + ++aceId,
        editor: undefined,
        content: undefined,
    }
});

var setContent= function( editor, content ) {
    editor.setValue(content);
    setOptions(editor);
}

T.call('onRendered', function() {
    var editor= initEditor(this._ace.id, { readOnly: true });
    this._ace.editor= editor;
    if ( this._ace.content ) setContent(editor, this._ace.content);
});


T.helper('aceEditorId', function() {
    var _ace= Template.instance()._ace;
    _ace.content= this.functionBody.code;
    if ( _ace.editor ) setContent(_ace.editor, _ace.content);
    return _ace.id;
});

SpongeTools.AceEditor= {
    show: show,
};
