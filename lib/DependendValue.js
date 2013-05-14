
DependendValue= function( value ) {
    var dependency= new Deps.Dependency

    this.get= function() {
        dependency.depend();
        return value;
    };

    this.set= function( newValue ) {
        if ( value === newValue || _.isEqual( value, newValue)) {
            return value;
        }

        value= newValue;
        dependency.changed();
    }
};

DependendValue.prototype.get= function() {
    this.dependency.depend();
    return this.value;
};