
Template.source.Name= function() {
    return new GuiTools.Edit({ context: this, property: 'Name' });
};

Template.source.Description= function() {
    return new GuiTools.Edit({ context: this, property: 'Description' });
};

Template.source.Organisation= function() {
    return new GuiTools.Edit({ context: this, property: 'Organisation' });
};

Template.source.Address= function() {
    return new GuiTools.Edit({ context: this, property: 'Address' });
};

Template.source.MailEdit= function() {
    return new GuiTools.Edit({ context: this, property: 'Mail' });
};

Template.source.wwwEdit= function() {
    return new GuiTools.Edit({ context: this, property: 'www' });
};

