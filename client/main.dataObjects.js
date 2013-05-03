
Template.dataObjects.schemas= function() {
    return getCachedData('getTypeVersions', 10000);
}

Template.dataObjects.rendered= function() {
    $('div.objectTypes').jstree({
        // the `plugins` array allows you to configure the active plugins on this instance
//        "plugins" : ["themes","html_data","ui"],
        // each plugin you have included can have its own config object
//        "core" : { "initially_open" : [ "phtml_1" ] }
        // it makes sense to configure a plugin only if overriding the defaults
    });
}

