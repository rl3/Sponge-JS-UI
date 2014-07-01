
var map;
var markers= [];
var polygons= [];

var bounds= undefined;
var eventHandlers= {};

var initialize= function( elem ) {
    var mapOptions = {
        zoom: 10,
        disableDoubleClickZoom: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER
        },
        panControl: false,
        panControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT,
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: false,
        scaleControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT
        },
        streetViewControl: false,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        }
    };

    map = new google.maps.Map(elem, mapOptions);

    bounds= undefined;
    clearEvents();

    google.maps.event.addListener(map, 'bounds_changed', function() {
        var b= map.getBounds();

        if ( !b ) return;

        var northEast= b.getNorthEast();
        var southWest= b.getSouthWest();

        var newBounds= {
            north: northEast.lat(),
            east:  northEast.lng(),
            south: southWest.lat(),
            west:  southWest.lng(),
        };
        if ( bounds && _.isEqual(bounds, newBounds) ) return;

        bounds= newBounds;
        fireEvents('bounds_changed', [bounds]);
    });

    // delegate events: https://developers.google.com/maps/documentation/javascript/reference?hl=de#Map (Events)
    ['click', 'dblclick', 'center_changed', 'drag', 'dragend', 'dragstart'].forEach(function( ev ) {
        google.maps.event.addListener(map, ev, function() {
            fireEvents(ev, arguments)
        });
    });

    var $closeDiv= $('<div class="maps-button"><div class="button" title="close"><div><i class="icon-remove"></i></div></div></div>');

    $closeDiv.click(hideMap);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push($closeDiv[0]);

    markers.forEach(function( marker ) {
        marker.setMap(map);
    });
}

var fireEvents= function( event, args ) {
    if ( !(event in eventHandlers) ) return;

    return eventHandlers[event].forEach(function( handler ) {
        handler.call.apply(handler.context, args);
    });
};

var unregisterEventHandler= function( event, id ) {
    if ( !id || !(event in eventHandlers) ) return;

    eventHandlers[event]= eventHandlers[event].filter(function( handler ) { return handler.id !== id; });
};

var registerEventHandler= function( event, handler, id, context ) {
    if ( event in eventHandlers ) {
        unregisterHandler(event, id);
    }
    else {
        eventHandlers[event]= [];
    }

    if ( !id ) id= 'autoId_' + eventHandlers[event].length;

    eventHandlers[event].push({
        call: handler,
        context: context,
        id: id,
    });
};

var removeMarkers= function() {
    while ( markers.length ) markers.shift().setMap(null);
};

var removePolygons= function() {
    while ( polygons.length ) polygons.shift().polygon.setMap(null);
};

var clearEvents= function() {
    eventHandlers= {};
};

var addMarker= function( lon, lat, options ) {
    if ( _.isArray(lon) ) {
        options= lat;
        lat= lon[1];
        lon= lon[0];
    }

    if ( !options ) options= {};

    var markerOptions= {
        position: new google.maps.LatLng(lat, lon),
    }

    if ( map ) markerOptions.map= map;

    if ( 'infotext' in options ) {
        var infowindow = new google.maps.InfoWindow({
          content: options.infotext,
        });

        delete options.infotext;
    }

    var events= options.events;
    if ( events ) delete options.events;

    if ( options ) {
        for ( var key in options ) {
            markerOptions[key]= options[key];
        }
    }

    var marker= new google.maps.Marker(markerOptions);

    if ( infowindow ) {
        google.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.open(map, marker);
        });
        google.maps.event.addListener(marker, 'mouseout', function() {
            infowindow.close();
        });
    }

    if ( events ) {
        for ( var name in events ) {
            google.maps.event.addListener(marker, name, events[name]);
        }
    }

    markers.push(marker);

    if ( map && options.center ) map.setCenter(markerOptions.position);

    return marker
};

var setViewRange= function( northEast, southWest ) {
    map.fitBounds(new google.maps.LatLngBounds(
        new google.maps.LatLng(southWest[0], southWest[1]),
        new google.maps.LatLng(northEast[0], northEast[1])
    ));
};

var getViewRange= function() {
    return bounds;
};

var get$container= function() {
    return $('#google-map-dialog');
    return $('#google-maps-container');
};

var get$map= function() {
    return $('#google-map-canvas');
};

var showMap= function( cb ) {
    SpongeTools.Modal.show(get$container(), function() {
        var $map= get$map();
        initialize($map[0]);
        if ( cb ) cb();
    });
};

var hideMap= function() {
    get$container().modal('hide');
//    get$container().hide();
};

var clearMap= function() {
    removeMarkers();
    removePolygons();
}

SpongeTools.Map= {
    removeMarkers: removeMarkers,
    addMarker: addMarker,
    setViewRange: setViewRange,
    getViewRange: getViewRange,
    show: showMap,
    hide: hideMap,
    clear: clearMap,
    registerEventHandler: registerEventHandler,
    unregisterEventHandler: unregisterEventHandler,
};
