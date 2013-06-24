
var dataCache= new Meteor.Collection("Cache");

if ( Meteor.isClient ) {

    var optionsToString= function( options ) {
        if ( options === undefined ) return '';

        if ( typeof options !== 'object' ) {
            return '(' + options + ')';
        }

        var keys= Object.keys(options);
        keys.sort();
        return '(' + keys.map(function( key ) {
            return key + ':[' + options[key] + ']';
        }).join(',') + ')';
    }

    var running= {};

    var getCachedData= function(id, timeout) {
        if ( arguments.length < 2 ) timeout= 1000000;
        return function( options ) {
            var now= new Date();
            var than= new Date(now - timeout);
            var query= { id: id, timeStamp: { $gt: than }, };
            if ( arguments.length ) {
                query.options= options;
            }
            var key= id + optionsToString(options);
            var data= dataCache.findOne(query);
            if ( data ) {
                delete running[key];
                return data.data;
            }
            if ( key in running ) {
                return;
            }

            running[key]= undefined;
            Meteor.apply(id, Array.prototype.slice.call(arguments));
        };
    };

    var saveData= function( name, timeout ) {
    }

    DataObjectTools.getCachedData= getCachedData;
    DataObjectTools.saveData= saveData;
}

DataObjectTools.dataCache= dataCache;