function genLinechart() {
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        width = $("#linechart").width() - margin.left - margin.right,
        height = $("#linechart").height() - margin.left - margin.right;

    // The number of olympics
    var n = years.length;
    
    // linear xScale to position the dots (not the axis)
    var xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, width]); // output

    // point scale to draw the X axis
    var xScaleAxis = d3.scalePoint()
        .domain(years) // input
        .range([0, width]); // output

    // Yscale will use the max number of medals possible
    var yScale = d3.scaleLinear()
        .range([height, 0]); // output

    var xAxis = d3.axisBottom(xScaleAxis)
        .tickValues(xScaleAxis.domain().filter(function(d, i) { return !(i % 2); }))

    var line = d3.line()
        .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.value.TotalMedals); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX); // apply smoothing to the line

    // dots tooltip
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "<strong>" + d.value.TotalMedals + "</strong> Medals in <strong>" + d.key + "</strong>";
        });

    // line tooltip
    var lineTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "<strong>" + d.key + "</strong>";
        });

    // start drawing the Linechart from the csv
    d3.csv("csv/summer_year_country_event.csv", function(error, data) {
        if (error) throw error;

        data.forEach(function(d){
            d.Year = +d.Year;
            d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
        });

        // Create a nested type data to sort the csv by country and year
        var processedData = d3.nest()
            .key(function(d) {return d.Country})
            .key(function(d) {return d.Year})
            .rollup(function(values) {
                return { 
                    "TotalMedals" : d3.sum(values, function(d) { 
                        return parseFloat(d.TotalMedals);
                    }) 
                };
            })
            .map(data);

        //fill blank spaces in array with zeroes (for years in which a country didn't won any medals)
        for(var i = 0; i < years.length; i++){
            if(!(processedData.get(countryFilter).has(years[i]))){
                processedData.get(countryFilter).set(years[i], { TotalMedals:0 });
            }
        }

        // automatically resize yScale according to max value of linechart
        yScale.domain([0, (d3.max(processedData.get(countryFilter).entries(), function (d) { return d.value.TotalMedals + 10; }))]);

        var svg = d3.select("#linechart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
        // initialize tooltip generator
        svg.call(tip);
        svg.call(lineTip);
        
        // Call the x axis in a group tag
        svg.append("g")
            .attr("class", "xAxis unselectable")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis); // Create an axis component with d3.axisBottom

        // text label for the x axis
        svg.append("text")
        .attr("class", "axislabel unselectable")
        .attr("transform", "translate(" + (width / 2) + " ," + 
                                (height + margin.top - 20) + ")")
        .style("text-anchor", "middle")
        .text("Years");


        // generate Y axis
        svg.append("g")
            .attr("class", "yAxis unselectable")
            .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft
        
        // text label for the y axis
        svg.append("text")
            .attr("class", "axislabel unselectable")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 5)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Medals");  

        svg.append("path")
            .datum(processedData.get(countryFilter).entries().sort(descending)) // Binds data to the line 
            .attr("class", "line") // Assign a class for styling 
            .attr("d", line); // Calls the line generator 

        // Appends a circle for each datapoint 
        svg.selectAll(".dot")
            .data(processedData.get(countryFilter).entries().sort(descending))
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("fill", function() { return getCSSColor('--linechart-dot-color') })
            .attr("cx", function(d, i) { return xScale(i) })
            .attr("cy", function(d) { 
                return yScale(d.value.TotalMedals) })
            .attr("r", 5)
            .attr("opacity",1)
            .on('mouseover', function(d){
                tip.show(d);
                d3.select(this).transition()
                    .ease(d3.easeElastic)
                    .duration(animationTime)
                    .attr("r", 10)
                    .attr("stroke-width", 2);
                })
            .on('mouseout', function(d){
                tip.hide(d);
                d3.select(this).transition()
                    .ease(d3.easeElastic)
                    .duration(animationTime)
                    .attr("r", function(d){
                        return (checkIfYearInInterval(d.key) ? 8 : 4);
                    })
                    .attr("stroke-width", 1);
            });
    });
    updateLinechart();
};

//updates linechart dots with a transition when called
function updateLinechart(){
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        width = $("#linechart").width() - margin.left - margin.right,
        height = $("#linechart").height() - margin.left - margin.right;

    // The number of olympics
    var n = 27;

    // linear xScale to draw the dots
    var xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, width]); // output
  
    d3.csv("csv/summer_year_country_event.csv", function(error, data) {
        data.forEach(function(d){
            d.Year = +d.Year;
            d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
        });

        var processedData = d3.nest()
            .key(function(d) {return d.Country})
            .key(function(d) {return d.Year})
            .rollup(function(values) {
                return { 
                    "TotalMedals" : d3.sum(values, function(d) {
                        switch(currentLevel){
                            case 0:
                                return parseFloat(d.TotalMedals);
                                break;
                            case 1:
                                if (d.Sport == sportFilter) { 
                                    return parseFloat(d.TotalMedals);
                                }
                                    return parseFloat(0);
                                break;
                            case 2:
                                if (d.Discipline == disciplineFilter) {
                                    return parseFloat(d.TotalMedals);
                                }
                                    return parseFloat(0);
                                break;
                            case 3:
                                if (d.Event == eventFilter) {
                                    return parseFloat(d.TotalMedals);
                                }
                                    return parseFloat(0);
                                break;
                        }
                     })
                };
            })
            .map(data);
            
        // fill blank spaces in array with zeroes (for years in which a country didn't won any medals)
        for(var i = 0; i < years.length; i++){
            if(!(processedData.get(countryFilter).has(years[i]))){
                processedData.get(countryFilter).set(years[i], { TotalMedals:0 });
            }
        }

        // adjust y axis component
        var YScale = d3.scaleLinear()
            .domain([0, (d3.max(processedData.get(countryFilter).entries(), function (d) { return d.value.TotalMedals + 10; }))]) // input 
            .range([height, 0]); // output

        // update line generator for new values
        var lineGenerator = d3.line()
            .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
            .y(function(d) { return YScale(d.value.TotalMedals); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        // update linechart in vis
        var svg = d3.select("#linechart");
            
        svg.select(".yAxis")
            .transition().duration(animationTime)
            .ease(d3.easeExp)
            .call(d3.axisLeft(YScale)); // Create an axis component with d3.axisLeft

        svg.select(".line")
            .datum(processedData.get(countryFilter).entries().sort(descending)) // Binds data to the line
            .transition().duration(animationTime)
            .ease(d3.easeExp)
            .attr("d", lineGenerator); // Calls the line generator 

        var dots = svg.selectAll(".dot")
            .data(processedData.get(countryFilter).entries().sort(descending));

        dots.transition()
            .duration(animationTime)
            .ease(d3.easeExp)
            .attr("cy", function(d) {
                return YScale(d.value.TotalMedals)
            })
            .attr("fill", function(d){
                return (checkIfYearInInterval(d.key) ? 
                    getCSSColor('--linechart-dot-highlight-color') 
                    : getCSSColor('--linechart-dot-color'));
            })
            .attr("opacity",function(d){
                return (checkIfYearInInterval(d.key) ? 1 : 0.6);
            })
            .attr("r", function(d){
                return (checkIfYearInInterval(d.key) ? 8 : 4);
            });
    });
};
