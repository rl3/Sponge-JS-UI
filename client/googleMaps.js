
var map;
var markers= [];

var initialize= function( elem ) {
    var mapOptions = {
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    }

    map = new google.maps.Map(elem, mapOptions);

    markers.forEach(function( marker ) {
        marker.setMap(map);
    });
}

var removeMarkers= function() {
    while ( markers.length ) markers.shift().setMap(null);
};

var addMarker= function( lon, lat, options ) {
    if ( _.isArray(lon) ) {
        options= lat;
        lat= lon[1];
        lon= lon[0];
    }

    var markerOptions= {
        position: new google.maps.LatLng(lat, lon),
    }

    if ( map ) markerOptions.map= map;

    if ( options ) {
        for ( var key in options ) {
            markerOptions[key]= options[key];
        }
    }

    markers.push(new google.maps.Marker(markerOptions));

    if ( map ) map.setCenter(markerOptions.position);
};

var get$container= function() {
    return $('#google-maps-container');
};

var get$map= function() {
    return $('#google-maps-canvas');
};

var showMap= function() {
    get$container().show();
    var $map= get$map();
    initialize($map[0]);
    addMarker(11.2, 53.6);
};

var hideMap= function() {
    get$container().hide();
};

DataObjectTools.removeMapMarkers= removeMarkers;
DataObjectTools.addMapMarker= addMarker;
DataObjectTools.showMap= showMap;
DataObjectTools.hideMap= hideMap;

setTimeout(function() {
    var $map= get$map();
    initialize($map[0]);
    addMarker(11.2, 53.6);
}, 5000);
