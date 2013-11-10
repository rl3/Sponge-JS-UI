
var map;
var markers= [];

var initialize= function( elem ) {
    var mapOptions = {
        zoom: 10,
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
        zoomControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
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
    }

    map = new google.maps.Map(elem, mapOptions);

    var $closeDiv= $('<div class="maps-button"><div class="button" title="close"><div><i class="icon-remove"></i></div></div></div>');

    $closeDiv.click(hideMap);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push($closeDiv[0]);

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

    if ( options ) {
        for ( var key in options ) {
            markerOptions[key]= options[key];
        }
    }

    var marker= new google.maps.Marker(markerOptions);

    if ( infowindow ) {
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
        });
    }

    markers.push(marker);

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
