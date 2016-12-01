function extendBounds(bounds, padding) {
	corner1 = bounds.getSouthWest();
	corner2 = bounds.getNorthEast();
	return L.latLngBounds(L.latLng(corner1.lat - padding[2], corner1.lng - padding[3]),
	L.latLng(corner2.lat + padding[0], corner2.lng + padding[1]));
}

function fitView() {
	bounds = extendBounds(markers.getBounds(), [60, 60, 60, 60]);
	map.fitBounds(bounds);
	var prev = showFace;
	showFace = ($('#mapid').width() > 600);
	if(prev != showFace) { drawMap(cleanabgeordnete); }
}

PFAD = "";

// only for current deputees
var cleanabgeordnete = [];
var markers = new L.FeatureGroup();;
var showFace = null;

//row numbers and their max seat numbers
var rows = [
  [1,20],
  [2, 45],
  [3, 76],
  [4, 115],
  [5, 159],
  [6, 209]
]



// remove abgeordnete from older Houses and adjust their names to not include umlauts
for(var i = 0; i < abgeordnete.length; i++){
    if(abgeordnete[i]["Reihe"] !== undefined){
      cleanabgeordnete.push(abgeordnete[i])
    }
    abgeordnete[i]["Vorname"] = abgeordnete[i]["Vorname"].replace("ö", "oe").replace("ä", "ae").replace("ü", "ue").replace("Ö", "Oe");
    abgeordnete[i]["Nachname"] = abgeordnete[i]["Nachname"].replace("ö", "oe").replace("ä", "ae").replace("ü", "ue").replace("Ö", "Oe");
}


// i need the seat number for each row; right now we have an absolute seat number for each deputee
for(var i = 0; i < cleanabgeordnete.length; i++){
  // these checks are made to see if the deputee sits in the first row and thus needs no seat adjustment
  if(rows[parseInt(cleanabgeordnete[i]["Reihe"])-2] !== undefined){
    cleanabgeordnete[i]["Sitz"] -= rows[parseInt(cleanabgeordnete[i]["Reihe"])-2][1];
  }
  cleanabgeordnete[i]["Sitz"] = parseInt(cleanabgeordnete[i]["Sitz"])
}


// calculate each angle for the half circle
function angle(abgeordneter) {
  var angle = 0

  // the splut determines the nubmer of partitions per row based on amount of seats in that row
  if(rows[parseInt(abgeordneter["Reihe"])-2] !== undefined){
    var split = rows[parseInt(abgeordneter["Reihe"])-1][1] - rows[parseInt(abgeordneter["Reihe"])-2][1]
  }
  else{
    var split = rows[parseInt(abgeordneter["Reihe"])-1][1]
  }

  var naiv_angle = (180/ split) * parseInt(abgeordneter["Sitz"])
  if(naiv_angle > 90){
    angle = Math.abs(180 - naiv_angle)
  }
  else {
    angle = naiv_angle
  }

  return angle * (Math.PI / 180)
}

// calculate the distance of each deputee
var offset = 0
var radius = 500

function distance(abgeordneter) {
  return offset + ((radius - offset)/rows.length) * parseInt(abgeordneter["Reihe"])
}

//calculate the y coordinate for each deputee
function y(abgeordneter) {
  return Math.sin(angle(abgeordneter)) * distance(abgeordneter)
}

//calculate the y coordinate for each deputee
function x (abgeordneter){
   if (rows[parseInt(abgeordneter["Reihe"])-2] !== undefined){
     var maxSeatsinRow = rows[parseInt(abgeordneter["Reihe"])-1][1] - rows[parseInt(abgeordneter["Reihe"])-2][1]
   }
   else {
     maxSeatsinRow = rows[parseInt(abgeordneter["Reihe"])-1][1]
   }
   return abgeordneter["Sitz"] > (maxSeatsinRow / 2) ?  500 + (Math.sqrt(Math.pow(distance(abgeordneter),2) - Math.pow(y(abgeordneter),2))) :  500 - (Math.sqrt(Math.pow(distance(abgeordneter),2) - Math.pow(y(abgeordneter),2)))
}

//function to show info card based on row and sear which serv as ID for each deputee, called by click on deputee marker icon

var partyColors = {
  "AfD": "afd",
  "DIE LINKE": "left",
  "CDU": "cdu",
  "SPD": "spd",
  "BÜ'90/GRÜNE": "green",
  "fraktionslos": "noparty"

}


function showInfoCard(row, seat){
    var abgeordneter = $.grep(cleanabgeordnete, function(e) { return e["Reihe"] == row && e["Sitz"] == seat })[0];
    $(".infoCard").empty()
    $(".infoCard").append(
      "<img class='profilepic' src='assets/newportraits/" + abgeordneter["Vorname"].toLowerCase() + "-" + abgeordneter["Nachname"].toLowerCase() + ".png'/>");
    $(".infoCard").append("<div class='info'></div>");
    $(".info").append(
      "<h3>" + abgeordneter["Vorname"] + " " + abgeordneter["Nachname"] + ", " + abgeordneter["Alter*"] + "</h3><br>" +
      "<h2>" + abgeordneter["Partei"] + "<span class='entry'>, im Abgeordnetenhaus seit " + abgeordneter["erster Einzug ins AGH**"] + "</span></h2><br>" +
      "<h4>" + abgeordneter["Beruf"] + " aus " + abgeordneter["Geburtsbundesland"] + "</h4><br>"
  )
  for(var i = 0; i < partyColors.length; i++){
    if($(".infoCard").hasClass(partyColors[abgeordneter["Partei"]])){
      $(".infoCard").toggleClass(partyColors[abgeordneter["Partei"]])
    }
    $(".infoCard").toggleClass(partyColors[abgeordneter["Partei"]])
  }
}


//apply filters to map and drae a new one based on input filter criteria
function filterMap(agevalues){

  // get all the parties that are checked
  var desiredParties = $(".parties").find("input").filter(":checked")

  //now, get their names
  var desiredPartiesNames = [];
  desiredParties.each(function(){
    desiredPartiesNames.push($(this).attr("name"))
  })



  // get a list of deputees matching the selected criteria
  var filteredAbgeordnete = $.grep(cleanabgeordnete, function(e) {
    return (parseInt(e["Alter*"]) <= agevalues[1]) && (parseInt(e["Alter*"]) >= agevalues[0])  && desiredPartiesNames.indexOf(e["Partei"]) != -1;
  })

  // delete the old map
  map.eachLayer(function (layer) {
    map.removeLayer(layer);
  });

  // draw a new one
  drawMap(filteredAbgeordnete);
}

function resetFilters(){
  //reset age-slider ranges
  slider.noUiSlider.set([minAge, maxAge])

  // check all checkboxes for Fraktionen
  $(".parties").find("input").each(function(){
    $(this).prop("checked", true);
  })


  // filterMap


}

function searchMap(){

  //reset all filters when searching for a name
  resetFilters();

  // the name in the search field
  var searchedName = $("#abgs").val()

  // get a list of deputees matching the selected criteria
  var filteredAbgeordnete = $.grep(cleanabgeordnete, function(e) {
    return (e["Vorname"].indexOf(searchedName) != -1) || (e["Nachname"].indexOf(searchedName) != -1) || ((e["Vorname"] + " " +  e["Nachname"]).indexOf(searchedName) != -1)
  })

  // delete the old map
  map.eachLayer(function (layer) {
    map.removeLayer(layer);
  });

  // draw a new one
  drawMap(filteredAbgeordnete);

}

// create the filter input elements

// parties
var parties = [];
var ages = [];
var professions = [];

// get list of all the relevant attributes that will be used in filters
for(var i = 0; i < cleanabgeordnete.length; i++){
  // parties
  if(parties.indexOf(cleanabgeordnete[i]["Partei"].replace(/'/g, "&#039;")) == -1){
    parties.push(cleanabgeordnete[i]["Partei"].replace(/'/g, "&#039;"));
  }
  // ages
  if(ages.indexOf(cleanabgeordnete[i]["Alter*"]) == -1){
    ages.push(parseInt(cleanabgeordnete[i]["Alter*"]));
  }
  // professions
  if(professions.indexOf(cleanabgeordnete[i]["Beruf"]) == -1){
    professions.push(cleanabgeordnete[i]["Beruf"]);
  }
}

// generates a map
var map = L.map('mapid', {
    crs: L.CRS.Simple,
	center: [315,202],
	zoomControl: false,
	scrollWheelZoom: false,
	doubleClickZoom: false,
	touchZoom: false,
	trackResize: false,
	boxZoom: false,
	zoom: 0,
	zoomSnap: 0.01,
	minZoom: -5,
	dragging: false
});


var bounds = [[1000 ,0], [1000,500]];
  //var image = L.imageOverlay('assets/test.png', bounds).addTo(map);


drawMap(cleanabgeordnete);
fitView();


$(window).on('resize', function () {
	fitView();
});


// create html for filter elements
// parties
$(".filter").append("<div class='parties'><h1>Fraktion</h1></div>");
for(var i = 0; i < parties.length; i++){
  $(".parties").append(
    " <input type='checkbox' name='" + parties[i] + "' value=''> " + parties[i] + "<br>"
  );
}

$(".parties").find("input").prop("checked", true);


$(".parties").find("input").each(function(){
  $(this).change(function(){
  filterMap([0, 100])
  })
})

//ages
var minAge = 100;
var maxAge = 0;



for(var i = 0; i < ages.length; i++){
  minAge = Math.min(minAge, ages[i])
  maxAge = Math.max(maxAge, ages[i])
}

$(".filter").append("<div class='ages'><h1>Alter</h1></div>");
$(".ages").append(
"<div id='age-slider'></div>"
);

var slider = document.getElementById('age-slider');

noUiSlider.create(slider, {
	start: [minAge, maxAge],
  tooltips: true,
	connect: true,
	range: {
		'min': minAge,
		'max': maxAge
	},
  format: wNumb({
		decimals: 0
	}),
});

slider.noUiSlider.on('update', function(values){
  filterMap(values);
})



//professions
$(".filter").append("<div class='search'><h1>Suche</h1></div>");
  $(".search").append(
    '<div class="ui-widget"><br>' +
    '<input id="abgs"><br>' +
    '</div>'
  );


$( function() {
   var abgeordnete = [];
   for (var i = 0; i < cleanabgeordnete.length; i++){
     abgeordnete.push(cleanabgeordnete[i]["Vorname"] + " " + cleanabgeordnete[i]["Nachname"])
   }
   $( "#abgs" ).autocomplete({
     source: abgeordnete,
     search: function() {
       searchMap()
   }
   });
 } );


// draws a map of all cleanabgeordnete
function drawMap(cleanabgeordnete){
	map.removeLayer(markers);
	markers = new L.FeatureGroup();

  for (var i = 0; i < cleanabgeordnete.length; i++) {
	var faceimage = PFAD;
	faceimage += (showFace)
	? "assets/newportraits/" + cleanabgeordnete[i]["Vorname"].toLowerCase() + "-" + cleanabgeordnete[i]["Nachname"].toLowerCase() + ".png"
	: "assets/transparent.png";
	var color = partyColors[cleanabgeordnete[i]["Partei"]]

    var face = L.icon({
      iconUrl: faceimage,
	  className: color + " face",
      iconSize:     [40, 40], // size of the icon
      iconAnchor:   [20, 20], // point of the icon which will correspond to marker's location
      popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
  });

    var sol = L.latLng([ y(cleanabgeordnete[i]), x(cleanabgeordnete[i]) ]);
    marker = L.marker(sol, {icon: face, riseOnHover: true, row: cleanabgeordnete[i]["Reihe"], seat: cleanabgeordnete[i]["Sitz"]})

	// infocard
	marker.addTo(markers).on('click', function (e) {
      showInfoCard(this.options.row, this.options.seat)
	});

	// tooltip
	var tool = L.tooltip({sticky: true}).setContent(cleanabgeordnete[i]["Vorname"] + " " + cleanabgeordnete[i]["Nachname"])
	marker.bindTooltip(tool);
  }

  map.addLayer(markers);
}
