/*
Tu Hoang
ESRGC
2014

class.js
utility functions that implements OOP
*/

/*
function that defines a new class by passing a new
prototype object (literal) as parameter. New classes
can extend/inherit from other classes by passing the 
inherit class name to extend property of the new class 
prototype object

Example:
var newClass = dx.define({
extend: OtherClass,
initialize: function(options){
};
});
*/
var define = function(child) {
  var ch = child;
  var p = ch.extend;
  var _class_ = null;
  if (p == null || typeof p == 'undefined') {
    _class_ = function() {
      if (typeof this.initialize != 'undefined')
        this.initialize.apply(this, arguments);
    };
    _class_.prototype = ch;
  }
  else {
    _class_ = function() {
      var init = typeof this.initialize == 'function' ? this.initialize : 'undefined';
      //run child initialize function if exists
      if (typeof init == 'function') {
        init.apply(this, arguments);
      }
    };
    extend(_class_, p); //inherit prototype
    copy(_class_.prototype, ch); //augment prototype
  }
  return _class_;
};
/*
Deep copy object prototype by new keyword.
This method creates a new prototype object, whose prototype 
is a copy of the parent's prototype, and assign it to the child prototype.
Finally, sets the child's prototype constructor to the child's constructor
*/
var extend = function(child, parent) {
  var F = function() { };
  F.prototype = parent.prototype;
  child.prototype = new F();
  child.prototype.constructor = child;
  child.parent = parent.prototype;
};
//copy object properties
var copy = function(dest, source) {
  dest = dest || {};
  if (source) {
    for (var property in source) {
      var value = source[property];
      if (value !== undefined) {
        dest[property] = value;
      }
    }
    /**
    * IE doesn't include the toString property when iterating over an object's
    * properties with the for(property in object) syntax.  Explicitly check if
    * the source has its own toString property.
    */
    /*
    * FF/Windows < 2.0.0.13 reports "Illegal operation on WrappedNative
    * prototype object" when calling hawOwnProperty if the source object
    * is an instance of window.Event.
    */

    var sourceIsEvt = typeof window.Event == "function"
                          && source instanceof window.Event;

    if (!sourceIsEvt &&
                source.hasOwnProperty && source.hasOwnProperty("toString")) {
      dest.toString = source.toString;
    }
  }
  return dest;
};

/*
Author: Tu hoang
ESRGC
Provides base (prototype) functions for mapviewer

implements leaflet API 
*/

app.Map.LeafletViewer = define({
  name: 'LeafletViewer',
  extend: app.Map.MapViewer,
  _className: 'LeafletViewer',
  initialize: function(options) {
    app.Map.MapViewer.prototype.initialize.apply(this, arguments);
    //map setup
    var minimal = L.tileLayer('http://{s}.tiles.mapbox.com/v3/esrgc.map-y9awf40v/{z}/{x}/{y}.png');
    //var satellite = L.tileLayer('http://{s}.tiles.mapbox.com/v3/esrgc.map-0y6ifl91/{z}/{x}/{y}.png');

    var baseMaps = {
      "Base Map": minimal
        //"Satellite": satellite
    }
    this.features = new L.FeatureGroup([
      //new L.Marker([39.0, -76.70]).bindPopup('Some organization'),
      //new L.Marker([39.0, -76.20]).bindPopup('Abc company'),
      //new L.Marker([38.9, -76.0]).bindPopup('Eastern shore company'),
      //new L.Marker([38.36, -75.59]).bindPopup('Salisbury University')
    ]);
    this.geoJsonFeatures = L.geoJson();
    this.clusterGroup = new L.MarkerClusterGroup(this.clusterOptions);

   var overlayMaps = {
      //'State': stateBoundary,
      //'Counties': counties,
      'Overlays': this.geoJsonFeatures

    }
    this.map = L.map(this.el, {
      layers: [
        minimal,
        this.features,
        this.geoJsonFeatures,
        this.clusterGroup
      ],
      center: this.center || new L.LatLng(39.0, -76.70),
      zoom: this.zoomLevel || 7,
      scrollWheelZoom: this.scrollZoom || false
    });


    //copy layers to layer controls
    if (typeof this.baseLayers != 'undefined')
      for (var i in this.baseLayers) {
        var layer = this.baseLayers[i];
        if (layer !== undefined)
          baseMaps[i] = layer;
      }
    var overlayMaps = {
      //other overlay layers go here
      //feature layer
      //'Features': this.features,
      'Overlays': this.geoJsonFeatures
    };
    if (typeof this.overlays != 'undefined') {
      for (var i in this.overlays) {
        var layer = this.overlays[i];
        overlayMaps[i] = layer;
      }
    }
    //L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    //L.control.scale().addTo(this.map);
  },
  getGeoJsonGroup: function() {
    return this.geoJsonFeatures;
  },
  getFeatureGroup: function() {
    return this.features;
  },
  addGeoJsonLayer: function(data, option) {
    if (typeof data == 'undefined') {
      console.log('No data found')
      return;
    }
    console.log('Adding data to map...');
    //console.log(data);
    if (this.geoJsonFeatures != 'undefined') {
      if (typeof option == 'undefined')
        this.geoJsonFeatures.addLayer(L.geoJson(data));
      else
        this.geoJsonFeatures.addLayer(L.geoJson(data, option));
    }
    console.log('------Data added to map');
  },
  clearGeoJsonFeatures: function() {
    if (this.geoJsonFeatures != 'undefined')
      this.geoJsonFeatures.clearLayers();
  },
  addFeatureToFeatureGroup: function(feature) {
    var features = this.features;
    if (typeof features == 'undefined') {
      console.log('No feature group found');
      return;
    }
    if (feature != null)
      features.addLayer(feature);
  },
  clearFeatures: function() {
    var features = this.features;
    if (typeof features == 'undefined') {
      console.log('No feature group found');
      return;
    }
    features.clearLayers();
  },
  createFeature: function(obj) {
    var wkt = new Wkt.Wkt();
    wkt.read(obj);
    var f = wkt.toObject();
    return f;
  },
  addClusterMarker: function(marker) {
    if (typeof this.clusterGroup == 'undefined')
      return;
    this.clusterGroup.addLayer(marker);
  },
  clearClusterMarkers: function() {
    this.clusterGroup.clearLayers();
  },
  getClusterGroup: function(){
    return this.clusterGroup;
  },
  getFeaturesBound: function() {
    var features = this.features;
    if (typeof features == 'undefined') {
      console.log('No feature group found');
      return;
    }
    return features.getBounds();
  },
  getGeoJsonFeaturesBound: function() {
    var features = this.geoJsonFeatures;
    if (typeof features == 'undefined') {
      console.log('No geojson feature found');
      return;
    }
    return features.getBounds();
  },
  zoomToFeatures: function() {
    var bounds = this.getFeaturesBound();
    if (typeof bounds != 'undefined')
      this.map.fitBounds(bounds);
  },
  zoomToGeoJsonFeatures: function() {
    var bounds = this.getGeoJsonFeaturesBound();
    if (typeof bounds != 'undefined')
      this.map.fitBounds(bounds);
  },
  zoomToPoint: function(point, zoom) {
    var z = zoom || this.map.getMaxZoom(); //default zoom
    if (typeof point.x != 'undefined' && typeof point.y != 'undefined') {
      var latlng = new L.LatLng(point.x, point.y);
      this.map.setView(latlng, z);
    } else {
      this.map.setView(point, z);
    }
  },
  pointInPolygon: function(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0],
      y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0],
        yi = vs[i][1];
      var xj = vs[j][0],
        yj = vs[j][1];

      var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

});

/*
Author: Tu hoang
ESRGC
Provides base (prototype) functions for mapviewer

This class implement leaflet API
*/


app.Map.MapViewer = define({
    name: 'MapViewer',
    _className: 'MapViewer',
    initialize: function(options) {
      copy(this, options);//copy all options to this class
    },
    zoomToExtent: function(extent) {
        this.map.fitBounds(new L.LatLngBounds(new L.LatLng(extent.xmin, extent.ymin),
         new L.LatLng(extent.xmax, extent.ymax)));
    },
    zoomToFullExtent: function() {
    },
    //zoom to xy (if level exists then zoom to that level otherwise maxlevel is used)
    zoomToXY: function(x, y, level) {
        if (typeof level == 'undefined')
            this.map.setView(new L.LatLng(y, x), this.map.getMaxZoom());
        else
            this.map.setView(new L.LatLng(y, x), level);
    },
    zoomIn: function() {
        this.map.zoomIn();
    },
    zoomOut: function() {
        this.map.zoomOut();
    },
    zoomToDataExtent: function(layer) {
        this.map.fitBounds(layer.getBounds());
    },
    panTo: function(x, y) {
        this.map.panTo(new L.LatLng(y, x));
    },
    locate: function() {
        this.map.locateAndSetView(this.map.getMaxZoom() - 2);
    }

});

