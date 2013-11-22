
var TypeCode= function( code ) {
    this._bsontype= 'Code';
    if ( typeof code === 'string' ) {
        this.code= code;
        return;
    }
    this.code= code.code;
    if ( 'scope' in code ) this.scope= code.scope;
};
TypeCode.prototype.clone= function() {
    return new TypeCode( this.code );
};
TypeCode.prototype.equals= function( other ) {
    return other instanceof TypeCode && other.code === this.code;
};
TypeCode.prototype.typeName= function() { return 'code'; };
TypeCode.prototype.toJSONValue= function() { return this; };

EJSON.addType('code', function( json ) {
    return new TypeCode(json);
});

SpongeTools.Types= {
    Code: TypeCode,
};


