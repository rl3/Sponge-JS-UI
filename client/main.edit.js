

var Edit= function( context, property, viewTemplateName, editTemplateName ) {
    this.context= context;
    this.property= property;
    this.viewTemplateName= viewTemplateName || 'editViewText';
    this.editTemplateName= editTemplateName || 'editEditText';
    this.editMode= DataObjectTools.ReactiveValue(false);
};
Edit.prototype.get= function() {
    return this.context[this.property];
};
Edit.prototype.set= function( value ) {
    this.context[this.property]= value;
};

Template.edit.editTemplate= function() {
    var self= this;
    this.tempValue= this.get();
    return new Handlebars.SafeString(Template[this.editTemplateName]({ value: this.tempValue, set: function( value ) { self.tempValue= value; } }));
};
Template.edit.viewTemplate= function() {
    return new Handlebars.SafeString(Template[this.viewTemplateName](this.get()));
};

Template.edit.editMode= function() {
    return this.editMode();
};

Template.edit.events({
    'click i.icon-edit': function( event ) {
        this.editMode(true);
        return false;
    },
    'click i.icon-ok-sign': function( event ) {
        this.editMode(false);
        this.set(this.tempValue);
        return false;
    },
    'click i.icon-remove-sign': function( event ) {
        this.editMode(false);
        return false;
    },
    'change input': function( event ) {
        this.set(event.currentTarget.value);
        return false;
    },
});


GuiTools= {
    Edit: Edit,
}