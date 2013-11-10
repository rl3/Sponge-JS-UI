

var Edit= function( options ) {
    this.options= options;
    if ( 'get' in options ) this.get= options.get;
    if ( 'set' in options ) this.set= options.set;
    this.viewTemplateName= options.viewTemplateName || 'editViewText';
    this.editTemplateName= options.editTemplateName || 'editEditText';
    this.asTr= options.asTr || false;

    this.editMode= DataObjectTools.ReactiveValue(false);
};
Edit.prototype.get= function() {
    return this.options.context[this.options.property];
};
Edit.prototype.set= function( value ) {
    this.options.context[this.options.property]= value;
};

Template.edit.editTemplate= function() {
    var self= this;
    this.tempValue= this.get();
    if ( _.isObject(this.tempValue) ) this.tempValue= _.clone(this.tempValue);

    return new Handlebars.SafeString(Template[this.editTemplateName]({
        value: this.tempValue,
        set: function( property, value ) {
            if ( property ) {
                self.tempValue[property]= value;
                return;
            }
            self.tempValue= value;
        },
    }));
};
Template.edit.viewTemplate= function() {
    return new Handlebars.SafeString(Template[this.viewTemplateName](this.get()));
};

Template.edit.editMode= function() {
    return this.editMode();
};

Template.edit.events({
    'click i.icon-edit, dblclick .viewMode.value': function( event ) {
        this.editMode(true);
        return false;
    },
    'click i.icon-ok-sign': function( event ) {
        this.editMode(false);
        if ( !_.isEqual(this.get(), this.tempValue) ) {
            this.set(this.tempValue);
        }
        return false;
    },
    'click i.icon-remove-sign': function( event ) {
        this.editMode(false);
        return false;
    },
    'change input, change select': function( event ) {
        this.set(event.currentTarget.name, event.currentTarget.value);
        return false;
    },
});

var types= [ 'Double', 'Integer', 'String', 'Date', 'Array' ];
Template.editEditType.types= function( currentType ) {
    return types.map(function( type ) {
        return {
            type: type,
            selected: type == currentType,
        }
    });
}

GuiTools= {
    Edit: Edit,
};

