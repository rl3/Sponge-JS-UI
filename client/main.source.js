
Template.source.Name= function() {
    return new GuiTools.Edit(this, 'Name');
};

Template.source.Description= function() {
    return new GuiTools.Edit(this, 'Description');
};

Template.source.Organisation= function() {
    return new GuiTools.Edit(this, 'Organisation');
};

Template.source.Address= function() {
    return new GuiTools.Edit(this, 'Address');
};

Template.source.MailEdit= function() {
    return new GuiTools.Edit(this, 'Mail');
};

Template.source.wwwEdit= function() {
    return new GuiTools.Edit(this, 'www');
};

