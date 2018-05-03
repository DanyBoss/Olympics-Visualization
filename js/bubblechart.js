/**
 * Bubblechart Module
 */
var Bubblechart = (function() {

    let tip,
        svg,
        minBubbleSize = 23,
        maxBubbleSize = 60,
        offsetBetweenBubbles = 5,
        width = $("#bubblechart").width(),
        height = $("#bubblechart").height();

    let radiusScale,
        centerForce,
        simulation;

    var initialize = function() {
        svg = d3.select("#bubblechart")
            .append("svg")
            .attr("height", height)
            .attr("width", width)
            .append("g");

        // tooltip generator
        tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return  "<center>" + d[currentFilterKeyword] + "</center>" + "<br>" +
                        "<center>" + 
                        "<font color=#FFD700> <strong>" + d.GoldCount   + "</strong>🥇 </font>" +
                        "<font color=#C0C0C0> <strong>" + d.SilverCount + "</strong>🥈 </font>" +
                        "<font color=#cd7f32> <strong>" + d.BronzeCount + "</strong>🥉 </font>" +
                        "</center>";
            });

        svg.call(tip);

        // Automatic Bubble Scaler.
        radiusScale = d3.scaleSqrt();
        
        // black hole kind of force to center the bubbles
        centerForce = d3.forceCenter(width / 2, height / 2);  

        // the simulation is a collection of forces
        // about where we want our circles to go
        // and how we want our circles to react
        simulation = d3.forceSimulation()
            //.force("x", d3.forceX().strength(0.05))
            //.force("y", d3.forceY().strength(0.05))
            .force("center_force", centerForce)
            .force("collide", d3.forceCollide(
                function(d){
                    return radiusScale(d.TotalMedals) + offsetBetweenBubbles;
                })
            );

        update();
    };

    var update = function() {                     
        // create new bubbles as necessary
        d3.csv("csv/summer_year_country_event.csv", function(error, data) {
            if (error) throw error;

            data.forEach(function(d){
                d.Year = +d.Year;
                d.GoldCount = +d.GoldCount;
                d.SilverCount = +d.SilverCount;
                d.BronzeCount = +d.BronzeCount;
                d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
            });

            // filter the data, first by year and then by Country
            let filteredData = data.filter(function(d, i) {
                if(countrySelection.includes(d["Country"]) && initialYearFilter <= d["Year"] && d["Year"] <= endYearFilter) {
                    switch(currentState) {
                        case 0: //all information
                            return d;
                            break;

                        case 1: // Specific Sport
                            if(d["Sport"] == sportFilter) {
                                return d;
                            }
                            break;

                        case 2: // Specific Discipline
                            if(d["Discipline"] == disciplineFilter) {
                                return d;
                            }
                            break;

                        case 3: // Specific Event
                            if (d["Event"] == eventFilter) {
                                return d;
                            }
                            break;
                    }
                }
            });

            // create a new array with adding up information from different years of the olympics using a specified filter
            let processedData = [];

            filteredData.forEach(function(d, i, filteredData) {
                //if the data doesn't exist in the processed array, create it
                if(processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword]) == -1) {
                    processedData[processedData.length] = {
                            "Country" : d.Country, 
                            "Sport" : d.Sport, 
                            "Discipline" : d.Discipline,
                            "Event" : d.Event,
                            "GoldCount" : d.GoldCount, 
                            "SilverCount" : d.SilverCount, 
                            "BronzeCount" : d.BronzeCount, 
                            "TotalMedals" : d.TotalMedals
                        }
                } else {
                    //if it already exists simply update counts
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].GoldCount += d.GoldCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].SilverCount += d.SilverCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].BronzeCount += d.BronzeCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].TotalMedals += d.TotalMedals;
                }
            });

            // update radiusScale function to work in accordance to size bubbles
            // we scale the larger range domain by scaling it with accordance of the ammount
            // of bubbles that will be drawn on screen
            radiusScale
                .domain([1, (d3.max(processedData, function(d){ return +d.TotalMedals + 5; }) )])
                .range([minBubbleSize, maxBubbleSize - (processedData.length / 2)]);

            // Cleanup View.
            svg.selectAll(".bubble").remove();
            
            // The bubbles container.
            let bubbleGroup = svg.selectAll(".bubble")
                .data(processedData)
                .enter().append("g")
                .attr("class", "bubble");

            let bubble = bubbleGroup.append("circle")
                .attr("r", function(d){
                    return radiusScale(d.TotalMedals);
                })
                .attr("fill", function(d){
                    return color(d[currentFilterKeyword]);
                })
                .attr("stroke", function() { return getCSSColor('--main-dark-color') })
                .attr("stroke-width", "2")
                .on('mouseover', function(d){
                    tip.show(d);
                    d3.select(this).transition().duration(animationTime)                  
                        .ease(d3.easeElastic)
                        .attr("stroke", function() { return getCSSColor('--main-white-color') })
                        .attr("r", function(d){
                            return radiusScale(d.TotalMedals) + offsetBetweenBubbles;
                        })
                        .style("cursor", (currentState == 3 ? "default" : "pointer")); 
                    })
                .on('mouseout', function(d){
                    tip.hide(d);
                    d3.select(this).transition().duration(animationTime)
                        .ease(d3.easeElastic)    
                        .attr("stroke", function() { return getCSSColor('--main-dark-color') })
                        .attr("r", function(d){
                            return radiusScale(d.TotalMedals);
                        })
                        .style("cursor", "default"); 
                })
                .on("click", function(d){
                    tip.hide(d);

                    selectedNode = d;
                    
                    if(currentState != 3) {
                        updateDashboardState(-1); //going deeper
                    }
                });

            // text labels that appear on top of the bubbles
            let labels = bubbleGroup.append("text")
                .attr("class","label unselectable")
                .text(function(d){  // function to rename long sport names to something digestable 
                    if((radiusScale(d.TotalMedals) < 32 && d[currentFilterKeyword].length > 6) 
                        || (radiusScale(d.TotalMedals) < 46 && d[currentFilterKeyword].length > 10)){
                        return  d[currentFilterKeyword].substring(0, 4) + "...";
                    } else
                        return d[currentFilterKeyword]; 
                })
                
            //back icon functionality
            d3.select('#back-icon')
                .on('mouseover', function(d){
                    d3.select(this).transition()
                        .style("cursor", "pointer"); 
                })
                .on('mouseout', function(d){
                    d3.select(this).transition()
                        .style("cursor", "default"); 
                })
                .on("click", function(d){
                    updateDashboardState(1);
                })

            // restart the animation with a new alpha value
            simulation.nodes(processedData)
                .alpha(1)
                .alphaDecay(0.4)
                .on('tick', ticked)
                .restart();

            function ticked()  {
                bubble
                    .attr("cx", function(d) { return d.x = Math.max(radiusScale(d.TotalMedals), Math.min(width - radiusScale(d.TotalMedals), d.x)); })
                    .attr("cy", function(d) { return d.y = Math.max(radiusScale(d.TotalMedals), Math.min(height - radiusScale(d.TotalMedals), d.y)); })
                    
                labels
                    .attr("x", function(d) { return d.x; } )
                    .attr("y", function(d) { return d.y; } )
            }
        });
    };

    return {
        initialize: initialize,
        update: update
    };

})();