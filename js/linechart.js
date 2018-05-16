/**
 * Linechart Module
 */
var Linechart = (function(){

    let tip,
        svg,
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = $("#linechart").width(),
        height = $("#linechart").height();
    
    // The number of olympics
    let n = years.length;
        
    // linear xScale to position the dots (not the axis)
    let xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, width-100]); // output

    // point scale to draw the X axis
    let xAxisScale = d3.scalePoint()
        .domain(years) // input
        .range([0, width-100]); // output

    // Yscale will use the max number of medals possible
    let yScale = d3.scaleLinear()
        .range([height-100, 0]); // output

    let xAxis = d3.axisBottom(xAxisScale)
        .tickValues(xAxisScale.domain().filter(function(d, i) { return !(i % 2); }))

    /**
     * Initializes a new Linechart.
     */
    var initialize = function() {
        let line = d3.line()
            .x(function(d, i) { return xScale(i); })
            .y(function(d) { return yScale(d.value.TotalMedals); })
            .curve(d3.curveMonotoneX);

        // dots tooltip
        tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return "<strong>" + d.value.TotalMedals + "</strong> Medals in <strong>" + d.key + "</strong>";
            });

        // start drawing the Linechart from the csv
        d3.csv("csv/summer_year_country_event.csv").then(function(data) {

            data.forEach(function(d){
                d.Year = +d.Year;
                d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
            });

            // Create a nested type data to sort the csv by country and year.
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

            // Fill blank spaces in array with zeroes (for years in which a country didn't won any medals).
            for(var i = 0; i < years.length; i++){
                if(!(processedData.get(countrySelection[0]).has(years[i]))){
                    processedData.get(countrySelection[0]).set(years[i], { TotalMedals:0 });
                }
            }
        
            yScale.domain([0, (d3.max(processedData.get(countrySelection[0]).entries(), function (d) { return d.value.TotalMedals + 10; }))]);

            svg = d3.select("#linechart")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(tip);
            
            // X Axis.
            svg.append("g")
                .attr("class", "xAxis unselectable")
                .attr("transform", "translate(0," + (height - margin.left - margin.top) + ")")
                .call(xAxis);

            svg.append("text")
                .attr("class", "axislabel unselectable")
                .attr("transform", "translate(" + ((width / 2) - margin.right) + " ," + 
                                    (height - margin.left - margin.top+30) + ")")
                .style("text-anchor", "middle")
                .text("Years");

            // Y Axis
            svg.append("g")
                .attr("class", "yAxis unselectable")
                .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft
            
            svg.append("text")
                .attr("class", "axislabel unselectable")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left + 5)
                .attr("x", 0 - (height / 2) + margin.right)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Medals");  

            // Create 4 line Entitities
            for(i = 0; i < 4; i++){
                // Line.
                svg.append("path")
                    .datum(processedData.get(countrySelection[0]).entries().sort(descending))
                    .attr("class", function(d){
                        return (i == 0 ? "line id"+i : "line id" + i +" hidden");
                    })
                    .attr("stroke", function(d) {return getColor(countrySelection[0])})
                    .attr("d", line);
                
                // Dots in Line.
                svg.selectAll(".dot id" + i)
                    .data(processedData.get(countrySelection[0]).entries().sort(descending))
                    .enter().append("circle") // Uses the enter().append() method
                    .attr("class", function(d){
                        return (i == 0 ? "dot id"+i : "dot id" + i +" hidden");
                    })
                    .attr("fill", function(d){ return d3.rgb(getColor(countrySelection[0])) })
                    .attr("cx", function(d, i) { return xScale(i) })
                    .attr("cy", function(d) { 
                        return yScale(d.value.TotalMedals) })
                    .attr("r", 8)
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
                }
        });
    };

    /**
     * Updates the Linechart according to the filters.
     * @param {boolean} forceRefresh Forces the linechart to refresh 
     */
    var update = function(forceRefresh = false) {
        d3.csv("csv/summer_year_country_event.csv").then(function(data) {
            data.forEach(function(d){
                d.Year = +d.Year;
                d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
            });

            let processedData = d3.nest()
                .key(function(d) {return d.Country})
                .key(function(d) {return d.Year})
                .rollup(function(values) {
                    return { 
                        "TotalMedals" : d3.sum(values, function(d) {
                            switch(currentState) {
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
                
            let bestDomain = [0, 1];

            countrySelection.forEach(function(element){

                // Ignore null elements.
                if(element === null){ return; }

                // Fill blank spaces in array with zeroes (for years in which a country didn't won any medals).
                for(var i = 0; i < years.length; i++){
                    if(!(processedData.get(element).has(years[i]))){
                        processedData.get(element).set(years[i], { TotalMedals:0 });
                    }
                }
                // Readjust the Y Scale.
                if(bestDomain[1] < d3.extent(processedData.get(element).entries(), function(d) { return d.value.TotalMedals; })[1]){
                    bestDomain = d3.extent(processedData.get(element).entries(), function(d) { return d.value.TotalMedals; });
                    yScale.domain(bestDomain).nice()
                }
            });

            // Update line generator for new values.
            let lineGenerator = d3.line()
                .x(function(d, i) { return xScale(i); })
                .y(function(d) { return yScale(d.value.TotalMedals); }) 
                .curve(d3.curveMonotoneX);
                
            svg.select(".yAxis")
                .transition().duration(animationTime)
                .ease(d3.easeExp)
                .call(d3.axisLeft(yScale));

            for(i = 0; i < countrySelection.length; i++) {

                let element = countrySelection[i];
                
                // Skip null elements and hide them.
                if(element === null) { 
                    hideLine(i);
                    break; 
                } 

                svg.select(".line.id" + i)
                    .datum(processedData.get(element).entries().sort(descending))
                    .transition().duration(animationTime)
                    .ease(d3.easeExp)
                    .attr("stroke", function(d) { return getColor(element)} )
                    .attr("d", lineGenerator);

                svg.selectAll(".dot.id" + i)
                    .data(processedData.get(element).entries().sort(descending))
                    .transition()
                    .duration(animationTime)
                    .ease(d3.easeExp)
                    .attr("cy", function(d) {
                        return yScale(d.value.TotalMedals)
                    })
                    .attr("fill", function(d){
                        return (checkIfYearInInterval(d.key) ? 
                            d3.rgb(getColor(element))
                            :  d3.rgb(getColor(element)).brighter());
                    })
                    .attr("opacity",function(d){
                        return (checkIfYearInInterval(d.key) ? 1 : 0.6);
                    })
                    .attr("r", function(d){
                        return (checkIfYearInInterval(d.key) ? 8 : 4);
                    });

                    // Make line visible
                    showLine(i);
            }
        }) 
    };
    var hideLine = function(lineID) {
        d3.select("#linechart .line.id" + lineID).classed("hidden", true);
        d3.selectAll("#linechart .dot.id" + lineID).classed("hidden", true);
    }

    var showLine = function(lineID) {
        d3.select("#linechart .line.id" + lineID).classed("hidden", false)
        d3.selectAll("#linechart .dot.id" + lineID).classed("hidden", false);
    }

    return {
        initialize:initialize,
        update:update
    };
    
})();

