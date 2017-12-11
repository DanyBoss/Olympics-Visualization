// generates a new bubblechart. 
// the update flag must be set to true if its an update of an old bubblechart, false otherwise
// isGoingLower determines the if we're going in a deeper level (-1), staying on the same level (0)
// or going up a level (1)
function genBubblechart(update, isGoingLower) {
    
        var width = $("#bubblechart").width(),
            height = $("#bubblechart").height(),
            minBubbleSize = 23,
            maxBubbleSize = 60,
            offsetBetweenBubbles = 5;
    
        // if its a update callback we don't want to create a new svg, so we just select it
        if(!update){
            var svg = d3.select("#bubblechart")
                .append("svg")
                .attr("height", height)
                .attr("width", width)
                .append("g");
        } else
            var svg = d3.select("#bubblechart g");
    
        // set a automatic bubble scaler
        var radiusScale = d3.scaleSqrt();
        
        // black hole kind of force to center the bubbles
        var center_force = d3.forceCenter(width / 2, height / 2);  
    
        // the simulation is a collection of forces
        // about where we want our circles to go
        // and how we want our circles to react
        var simulation = d3.forceSimulation()
            //.force("x", d3.forceX().strength(0.05))
            //.force("y", d3.forceY().strength(0.05))
            .force("center_force", center_force)
            .force("collide", d3.forceCollide(function(d){
                   return radiusScale(d.TotalMedals) + offsetBetweenBubbles;
                    })
                );
        
        // tooltip generator
        var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>" + d.GoldCount + "</strong> Gold // <strong>" + d.SilverCount + "</strong> Silver // <strong>" 
            + d.BronzeCount + "</strong> Bronze on <strong>" + d[currentFilterKeyword] + "</strong>";
        });
        
        drawBubbles(0);
    
        // update on click with the DOM information of who clicked it
        // isGoingLower is a bool that defines if we're going into a
        // lower or upper level and node is a variable set on click element
        function drawBubbles(isGoingLower) {
                
            //update current Level to new wanted level
            switch(isGoingLower){
                case -1:
                    currentLevel = currentLevel+1;
                    break;
                case 0:
                    currentLevel = currentLevel;
                    break;
                case 1:
                    currentLevel = currentLevel-1;
                    break;
            }
    
            //check if currentLevel is possible [1,3]
            //early exit if not possible, and set the currentLevel to regular values
            if( (1 > currentLevel || currentLevel > 3) ){
                switch(currentLevel){
                    case 0:
                        currentLevel = 1;
                        break;
                    case 4:
                        currentLevel = 3;
                        break;
                }
                return;
            }
    
            // select the dataset to use according to the level we're in, 
            // and also update css global variables

            var yearsText = (endYearFilter == initialYearFilter ? " in <strong>" + initialYearFilter + "</strong>" : 
            "from <strong>" +  initialYearFilter + "</strong> to <strong>" + endYearFilter + "</strong>");
            console.log(yearsText);


            switch(currentLevel) {
                case 1:
                    sportFilter = "All";
                    currentFilterKeyword = "Sport";
                    $('#statelabel').html("<strong>" + countryName 
                        + "</strong> on <strong> every Event </strong>" + yearsText);
                    $('#back-icon').hide(250);
                    break;
                case 2:
                    sportFilter = selectedNode.Sport;
                    currentFilterKeyword = "Discipline";
                    $('#statelabel').html("<strong>" + countryName + "</strong> on <strong>" 
                        + sportFilter + "</strong>" + yearsText);
                    $('#back-icon').show(250);
                    break;
                case 3:
                    disciplineFilter = selectedNode.Discipline;
                    currentFilterKeyword = "Event";
                    $('#statelabel').html("<strong>" + countryName + "</strong> on <strong>" 
                        + disciplineFilter + "</strong>" + yearsText);
                    $('#back-icon').show(250);
                    break;
            }
    
            // cleanup view
            svg.selectAll(".bubble").remove();
            
            svg.call(tip);

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
                var filteredData = data.filter(function(d, i){
                    if(d["Country"] == countryFilter && initialYearFilter <= d["Year"] && d["Year"] <= endYearFilter){
                        switch(currentLevel){
                            case 1:
                                return d;
                                break;
                            case 2:
                                if (d["Sport"] == sportFilter)
                                    return d;
                                break;
                            case 3:
                                if  (d["Discipline"] == disciplineFilter)
                                    return d;
                                break;
                        }
                    }
                })
    
                // create a new array with adding up information from different years of the olympics using a specified filter
                var processedData = [];
                filteredData.forEach(function(d, i, filteredData){
                    //if the data doesn't exist in the processed array, create it
                    if(processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword]) == -1){
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
                        //if it already exists simply update variables
                        processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].GoldCount += d.GoldCount;
                        processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].SilverCount += d.SilverCount;
                        processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].BronzeCount += d.BronzeCount;
                        processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].TotalMedals += d.TotalMedals;
                    }
                })
    
                // update radiusScale function to work in accordance to size bubbles
                // we scale the larger range domain by scaling it with accordance of the ammount
                // of bubbles that will be drawn on screen
                radiusScale
                    .domain([1, (d3.max(processedData, function(d){ return +d.TotalMedals + 5; }) )])
                    .range([minBubbleSize, maxBubbleSize - (processedData.length / 2)]);

                // a container for bubble stuff
                var bubbleGroup = svg.selectAll(".bubble")
                    .data(processedData)
                    .enter().append("g")
                    .attr("class", "bubble");

                // the bubble object
                var bubble = bubbleGroup.append("circle")
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
                            .style("cursor", "pointer"); 
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
                        // update global variable
                        selectedNode = d;
    
                        drawBubbles(-1); //going deeper
                        updateLinechart();
                        genScatterplot(true);
                    });
    
                // text labels that appear on top of the bubbles
                var labels = bubbleGroup.append("text")
                    .attr("class","label unselectable")
                    .text(function(d){ 
                        if((radiusScale(d.TotalMedals) < 30 && d[currentFilterKeyword].length > 6) || d[currentFilterKeyword].length > 15){
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
                        drawBubbles(1);
                        updateLinechart();
                        genScatterplot(true);
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
    };