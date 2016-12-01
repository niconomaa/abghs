
var abgeordnete = []

// only for current deputees
var cleanabgeordnete = []

//row numbers and their max seat numbers
var rows = [
  [1,20],
  [2, 45],
  [3, 76],
  [4, 115],
  [5, 159],
  [6, 209]
]

// get the json data and push into array of abgeordnete
$.ajax({
  url: './Data/data.json',
  async: false,
  dataType: 'json',
  success: function (json) {
    abgeordnete = json;
  }
});

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
function filterMap(){

  // get all the parties that are checked
  var desiredParties = $(".parties").find("input").filter(":checked")

  //now, get their names
  var desiredPartiesNames = [];
  desiredParties.each(function(){
    desiredPartiesNames.push($(this).attr("name"))
  })

  // get a list of deputees matching the selected criteria
  var filteredAbgeordnete = $.grep(cleanabgeordnete, function(e) { return desiredPartiesNames.indexOf(e["Partei"]) !== -1})

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
  if(parties.indexOf(cleanabgeordnete[i]["Partei"]) == -1){
    parties.push(cleanabgeordnete[i]["Partei"]);
  }
  // ages
  if(ages.indexOf(cleanabgeordnete[i]["Alter"]) == -1){
    ages.push(cleanabgeordnete[i]["Alter"]);
  }
  // professions
  if(professions.indexOf(cleanabgeordnete[i]["Beruf"]) == -1){
    professions.push(cleanabgeordnete[i]["Beruf"]);
  }
}

// create html for filter elements
// parties
$(".filter").append("<div class='parties'><h1>Fraktion</h1></div>");
for(var i = 0; i < parties.length; i++){
  $(".parties").append(
    " <input type='checkbox' name='" + parties[i] + "' value=''> " + parties[i] + "<br>"
  );
}

$(".parties").find("input").each(function(){
  $(this).change(function(){
  filterMap()
  })
})

//ages
var minAge = 0;
var maxAge = 0;

for(var i = 0; i < ages.length; i++){
  minAge = Math.min(minAge, ages[i])
  maxAge = Math.max(maxAge, ages[i])
}

$(".filter").append("<div class='ages'><h1>Alter</h1></div>");
$(".ages").append(
"<div id='age-slider'></div>"
);

$( function() {
   $( "#age-slider" ).slider({
     range: true,
     min: minAge,
     max: maxAge,
     values: [ 75, 300 ],
     slide: function( event, ui ) {
       $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
     }
   });
   $( "#amount" ).val( "$" + $( "#age-slider" ).slider( "values", 0 ) +
     " - $" + $( "#age-slider" ).slider( "values", 1 ) );
 } );
 
//professions
$(".filter").append("<div class='professions'><h1>Beruf</h1></div>");
for(var i = 0; i < professions.length; i++){
  $(".professions").append(
    " <input type='checkbox' name='profession' value=''> " + professions[i] + "<br>"
  );
}

// draws a map of all cleanabgeordnete
function drawMap(cleanabgeordnete){

  for (var i = 0; i < cleanabgeordnete.length; i++) {
    // get the correct image based on how it is named (first-last or last-fist)
    var faceimg = "";
    $.ajax({
        url:"assets/newportraits/"  +  cleanabgeordnete[i]["Vorname"].toLowerCase() + "-" + cleanabgeordnete[i]["Nachname"].toLowerCase()+ ".png",
        type:'HEAD',
        async: false,
        success: function()
        {
            getImage(cleanabgeordnete[i], "normal")
        },
        error: function()
        {
          getImage(cleanabgeordnete[i], "reverse")
        }
    });

      function getImage(abg, dir){
        if(dir != "reverse"){
          faceimg = "assets/newportraits/"  +  abg["Vorname"].toLowerCase() + "-" + abg["Nachname"].toLowerCase()+ ".png"
        }
        else{
            faceimg = "assets/newportraits/"  +  abg["Nachname"].toLowerCase() + "-" + abg["Vorname"].toLowerCase()+ ".png"
        }

      }


    var face = L.icon({

      iconUrl: "assets/newportraits/frank-hansel.png",

      iconSize:     [40, 40], // size of the icon
      iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });


    var markers = new L.FeatureGroup();

    markers.clearLayers();
    var sol = L.latLng([ y(cleanabgeordnete[i]), x(cleanabgeordnete[i]) ]);
    marker = L.marker(sol, {icon: face, riseOnHover: true, row: cleanabgeordnete[i]["Reihe"], seat: cleanabgeordnete[i]["Sitz"]})
    marker.addTo(markers).on('click', onClick);

    function onClick(e) {
      showInfoCard(this.options.row, this.options.seat)

  }

    $(marker._icon).addClass('face');
    $(".leaflet-marker-icon").addClass("face")
    marker.bindPopup(cleanabgeordnete[i]["Vorname"] + " " + cleanabgeordnete[i]["Nachname"]);
    marker.on('mouseover', function (e) {
      this.openPopup();
    });
    marker.on('mouseout', function (e) {
      this.closePopup();
    });
    map.setView(L.latLng([ 250, 500]));

    map.addLayer(markers);
    map.panTo([315,502])


  }
}

// generates a map
var map = L.map('mapid', {
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: 0
});


var bounds = [[1000 ,0], [1000,500]];
  //var image = L.imageOverlay('assets/test.png', bounds).addTo(map);

map.fitBounds(bounds);
drawMap(cleanabgeordnete);
