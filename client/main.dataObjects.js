
var propertyNames= ['type', 'version', 'objectId'];

var getProperties= function(href) {
    var reProperty= /(\w+)\[([^\]]+)\]/g;
    var result= {};
    for (var match; match= reProperty.exec(href);) {
        result[match[1]]= match[2];
    }
    return result;
};

var buildMenuPath= function(props) {
    return propertyNames
        .filter(function(p) { return props[p] !== undefined; })
        .map(function(p) { return p + '[' + props[p] + ']'; })
        .join('')
};

var isActive= function(path) {
    var currentPath= Session.get('dataObjectsTreePath');
    if (!currentPath) return false;
    path= String(path);
    if (path.length > currentPath.length) return false;
    return path === currentPath.substr(0, path.length);
};

var currentData= undefined;
var newData= false;
var getSchemas= getCachedData('getTypeVersions', 100000);

Template.dataObjects.schemas= function() {
    newData= !currentData;
    if (!currentData) currentData= getSchemas();
//    return Session.get('dataObjectsTreePath');
}

Template.dataObjects.rendered= function() {
    if (!currentData || !newData) return;

    var nodes= Object.keys(currentData)
        .map(function(type) { 
            var path= buildMenuPath({type: type});
            var versions= currentData[type];
            return {
                title: type + ' (' + versions.length + ')',
                isFolder: true,
                href: '#' + path,
                expand: isActive(path),
                children: versions.map(function(ver) {
                    var path= buildMenuPath({type: type, version: ver});
                    return {
                        title: 'Version ' + ver,
                        isFolder: true,
                        isLazy: true,
                        expand: isActive(path),
                        href: '#' + path,
                    };
                }),
            };
        });

    $('div.objectTypes').dynatree({
        debugLevel: 0,
        onActivate: function(node) {
            var href= $(node.span).find('a').attr('href');
            var typeVersion= getProperties(href);
            var path= buildMenuPath(typeVersion);
            Session.set('dataObjectsTreePath', path);
        },
        onLazyRead: function(node) {
            var href= $(node.span).find('a').attr('href');
            var typeVersion= getProperties(href);
            Meteor.call('getIdsByTypeVersion', typeVersion, function(err, ids) {
                if (err) return;
                node.setTitle(node.data.title + ' (' + ids.length + ')');
                (ids || []).forEach(function(id) {
                    typeVersion.objectId= id;
                    var path= buildMenuPath(typeVersion);
                    node.addChild({
                        title: id,
                        href: '#' + path,
                    });
                })
            });
        },
        children: nodes,
    });
}
