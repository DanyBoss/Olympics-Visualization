var MAX_SELECTED_COUNTRIES = 5;
var currentSelectedCountriesNumber = 0;

function genWorldMap() {
    // Define size of map group
    // Full world map is 2:1 ratio
    // Using 12:5 because we will crop top and bottom of map
    var margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = 2400,
        height = 1000,
        minZoom,
        maxZoom;

    // Define map projection
    var projection = d3.geoMercator()
        .center([0, 20]) // set centre to further North as we are cropping more off bottom of map
        .scale([width / (2 * Math.PI)]) // scale to fit group width
        .translate([width / 2, height / 2]); // ensure centred in group;

    // Define map path
    var path = d3.geoPath()
        .projection(projection);

    // Define map zoom behaviour
    var zoom = d3.zoom()
        .on("zoom", zoomed);

    //offsets for tooltips
    var c = document.getElementById('worldmap');
    var offsetL = c.offsetLeft+20;
    var offsetT = c.offsetTop+10;
    var tooltip = d3.select("#worldmap").append("div").attr("class", "tooltip hidden");

    function initiateZoom() {
        // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides  
        minZoom = Math.max($("#worldmap").width() / width, $("#worldmap").height() / height);

        maxZoom = 20 * minZoom;

        // define X and Y offset for centre of map to be shown in centre of holder
        midX = ($("#worldmap").width() - (minZoom * width)) / 2;
        midY = ($("#worldmap").height() - (minZoom * height)) / 2;
        zoom
            // set minimum extent of zoom to "minzoom", set max extent to a suitable factor of this value 
            .scaleExtent([minZoom, 10 * minZoom])
            // set translate extent so that panning can't cause map to move out of viewport 
            .translateExtent([[0, 0], [width, height]]);

        // change zoom transform to min zoom and centre offsets
        svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
    }
    // on window resize
    $(window).resize(function () {
        // Resize SVG
        svg
            .attr("width", $("#worldmap").width())
            .attr("height", $("#worldmap").height());
        initiateZoom();
    });

    // create an SVG
    var svg = d3.select("#worldmap")
        .append("svg")
        // set to the same size as the "map-holder" div
        .attr("width", $("#worldmap").width()-10)
        .attr("height", $("#worldmap").height()-10)
        .attr("fill", "rgb(255,255,255)")
        // add zoom functionality 
        .call(zoom);

    function getTextBox(selection) {
        selection.each(function (d) { d.bbox = this.getBBox(); })
    }

    // get map data
    d3.json("js/worldmap/simple_map.json", function (json) {
        //Bind data and create one path per GeoJSON feature
        countriesGroup = svg.append("g")
            .attr("id", "map");

        // draw a path for each feature/country
        countries = countriesGroup
            .selectAll("path")
            .data(json.features).enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", function() { return getCSSColor('--main-dark-color') })
            .attr("class", function (d) {
                if(getCountryIDinDB(d.properties.name_long) == -1)
                    return "non-selectable-country";
                else
                    return "country";
            })
            .attr("fill", function(d) {
                if (d3.select(this).classed("country"))
                    return color(d.properties.iso_a3);
                else
                    return "rgba(148, 148, 156, 0.692)"
            })
            // add a mouseover action to show name label for feature/country
            .on("mouseover", function (d) {
                d3.select(this).attr("stroke", function() { return getCSSColor('--main-white-color') })

                this.parentElement.appendChild(this);

                var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
                
                tooltip.classed("hidden", false)
                    .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                    .html(this.__data__.properties.name);
            })
            .on("mouseout", function (d) {
                d3.select(this).attr("stroke", function() { return getCSSColor('--main-dark-color') });
                tooltip.classed("hidden", true);
            })
            .on("click", function (d, i) {
                if (d3.select(this).classed("country")){
                    if (d3.event.shiftKey) {
                        if (d3.select(this).classed("country-on") == true) {
                            d3.select(this).classed("country-on", false);
                            currentSelectedCountriesNumber--;
                        }
                        else {
                            if (currentSelectedCountriesNumber < MAX_SELECTED_COUNTRIES) {
                                d3.select(this).classed("country-on", true);
                                currentSelectedCountriesNumber++;
                            }
                        }
                            
                    }
    
                    else {
                        d3.selectAll(".country").classed("country-on", false);
                        d3.select(this).classed("country-on", true);
                        currentSelectedCountriesNumber = 1;
                        boxZoom(path.bounds(d), path.centroid(d), 20);
                        changeCountry(convertNameToIOCCode(d.properties.name_long));
                    }
    
                } 
            });
        initiateZoom();
    });
    // apply zoom to countriesGroup
    function zoomed() {
        countriesGroup.attr("transform", d3.event.transform);
    }

    // zoom to show a bounding box, with optional additional padding as percentage of box size
    function boxZoom(box, centroid, paddingPerc) {
        minXY = box[0];
        maxXY = box[1];
        // find size of map area defined
        zoomWidth = Math.abs(minXY[0] - maxXY[0]);
        zoomHeight = Math.abs(minXY[1] - maxXY[1]);
        // find midpoint of map area defined
        zoomMidX = centroid[0];
        zoomMidY = centroid[1];
        // increase map area to include padding
        zoomWidth = zoomWidth * (1 + paddingPerc / 100);
        zoomHeight = zoomHeight * (1 + paddingPerc / 100);
        // find scale required for area to fill svg
        maxXscale = $("svg").width() / zoomWidth;
        maxYscale = $("svg").height() / zoomHeight;
        zoomScale = Math.min(maxXscale, maxYscale);
        // handle some edge cases
        // limit to max zoom (handles tiny countries)
        zoomScale = Math.min(zoomScale, maxZoom);
        // limit to min zoom (handles large countries and countries that span the date line)
        zoomScale = Math.max(zoomScale, minZoom);
        // Find screen pixel equivalent once scaled
        offsetX = zoomScale * zoomMidX;
        offsetY = zoomScale * zoomMidY;
        // Find offset to centre, making sure no gap at left or top of holder
        dleft = Math.min(0, $("svg").width() / 2 - offsetX);
        dtop = Math.min(0, $("svg").height() / 2 - offsetY);
        // Make sure no gap at bottom or right of holder
        dleft = Math.max($("svg").width() - width * zoomScale, dleft);
        dtop = Math.max($("svg").height() - height * zoomScale, dtop);
        // set zoom
        svg.transition()
            .duration(500)
            .call(zoom.transform,d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale));
    }
}