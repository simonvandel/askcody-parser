var request = require('request');
var proj4 = require('proj4')

var fromProj = proj4.defs('EPSG:3857')
var toProj = proj4.defs('WGS84')

request('https://way.onaskcody.com/data/routes/VrB7OV-9D0jz9', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var json = JSON.parse(response.body)
    var markersRaw = json.data.legs[0].map.markers
    var markersDone = markersRaw
                   .map(marker => {
                     return {
                       name: marker.name,
                       local_coords: marker.coords
                            }
                   })
                   .filter(marker => {
                     return (marker.name.indexOf("SCENE") > -1 || marker.name.indexOf("TELT") > -1)
                   })
                   .map(marker => {
                     return {
                       name: marker.name,
                       coords: local2Global(marker.local_coords)
                     }
                   })
                   .map(markerToGeoJson)
                   .map(colorizeMarkers)
    var result = makeCompleteGeoJson(markersDone)
    console.log(JSON.stringify(result))
  }
})

var roadColor = "#ff00ff"
var busColor = "#f17f83"
var stageColor = "#ffffff"

function colorizeMarkers(marker) {
  colorWhenContains(marker, "#ff0000", "toilet ")
  colorWhenContains(marker, "#ffff00", "hotelt ")
  colorWhenContains(marker, roadColor, "adelgade")
  colorWhenContains(marker, roadColor, "birkevej")
  colorWhenContains(marker, roadColor, "e45")
  colorWhenContains(marker, roadColor, "horsensvej")
  colorWhenContains(marker, roadColor, "møllegade")
  colorWhenContains(marker, roadColor, "vrold vej")
  colorWhenContains(marker, roadColor, "vrold tværvej")
  colorWhenContains(marker, roadColor, "vestergade")
  colorWhenContains(marker, busColor, "bus")
  colorWhenContains(marker, busColor, "stop")
  colorWhenContainsSensitive(marker, "#000000", "DK")
  colorWhenContainsSensitive(marker, stageColor, "SCENE")
  colorWhenContainsSensitive(marker, stageColor, "TELT")

  return marker
}

function colorWhenContainsSensitive(marker, color, substring) {
  if (marker.properties.title.indexOf(substring) > -1) {
    marker.properties["marker-color"] = color;
  }
  return marker
}

function colorWhenContains(marker, color, substring) {
  if (marker.properties.title.toLowerCase().indexOf(substring) > -1) {
    marker.properties["marker-color"] = color;
  }
  return marker
}

// Stage
// Toilet
// Rest

function makeCompleteGeoJson (markers) {
  return {
    "type": "FeatureCollection",
    "features": markers
  }
}

function markerToGeoJson(marker) {
  return {
    type: "Feature",
    properties: {
      "marker-color": "#7e7e7e",
      "marker-size": "medium",
      "marker-symbol": "",
      title: marker.name
    },
    geometry: {
      type: "Point",
      "coordinates": marker.coords
    }
  }
}

function local2Global(localCoords) {
  return proj4(fromProj, toProj, localCoords)
}

/*
1. get




Alperose
- global =​ 9.921768, 56.023865
- lokal =​  1104514.79, ​7563179.2
1 global x er (1104514.79 / 9.921768) lokal
 = 111322.376
 1 global y er (7563179.2 / 56.023865) lokal
 = 134999.2400560

Anettes Sandwich
- global = ​9.923528, ​56.025165
- lokal = ​1104684.37, ​7563457.36
1 global x er (1104684.37 / 9.923528) lokal
= 111319.7211
1 global y er (7563457.36 / 56.025165) lokal
= 135001.0724644

prediction (Bar Rock - YD79my):
lokal =     ​1104930.66, ​7563045.39
predicted global x = 1104930.66 / 111319.7211 = 9.925740462531
predicted global y = 7563045.39 / 135001.0724644  = 56.022113394

prediction (Club 86 - eZ4rlw):
lokal =     ​    ​1104716.02, ​7563453.77
predicted global x = ​1104716.02 / 111319.7211 = 9.92381232259
predicted global y = ​7563453.77 / 135001.0724644  = 56.0251384076559
rigtig global x =     ​9.923839,
rigtig global y =    ​ 56.025169
*/
