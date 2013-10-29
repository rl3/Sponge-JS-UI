
/**
 * creates a editable type map to show and edit types
 *
 * context: object containing types at property "prop"
 * prop: property containing types
 * changedFn: called with parameter "true" on write
 */
var editableTypeMap= function( context, prop, changedFn ) {
    if ( !context ) context= {};
    if ( !changedFn ) changedFn= function() {};
    var obj= context[prop];
    var info= (context.info || {})[prop];

    var infoFields= [ 'unit', 'description' ];

    if ( !obj ) return;

    return Object.keys(obj).map(function( key ) {
        return new GuiTools.Edit({
            get: function() {
                var type= obj[key];
                var valueInfo= (info || {})[key] || {};

                if ( valueInfo.unit === 'none' ) delete valueInfo.unit;
                return _.extend({
                    name: key,
                    type: type,
                    objectType: typeof type === 'object',
                    sparse: !info,
                }, valueInfo);
            },
            set: function( newValue ) {
                var oldValue= obj[key];
                var newName= newValue.name;
                changedFn(true);

                // type has been renamed
                if ( newName !== key ) {
                    if ( !newName || newName in obj ) {
                        delete obj[key];
                        if ( info && info[key] ) delete info[key];
                        return;
                    }
                    obj[newName]= obj[key];
                    delete obj[key];
                    if ( info && key in info ) {
                        info[newName]= info[key];
                        delete info[key];
                    }
                    key= newName;
                }

                obj[key]= newValue.type;
                if ( !info ) {
                    if ( !context.info ) context.info= {};
                    context.info[prop]= info= {};
                }
                info[key]= _.chain(newValue).omit('type', 'name', 'sparse').pairs().
                    filter(function( value ) { return value[1] !== undefined; }).object().value();
            },
            viewTemplateName: 'editViewType',
            editTemplateName: 'editEditType',
            asTr: true,
        });


    })
};


DataObjectTools.editableTypeMap= editableTypeMap;
