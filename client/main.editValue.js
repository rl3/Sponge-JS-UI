
Template.editValue.helpers({
    name: function() {
        return this.name;
    },
    value: function() {
        return DataObjectTools.valueToString(this);
    },
});
