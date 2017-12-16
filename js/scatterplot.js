
// generates a scatterplot
function genScatterplot(update) {

    var processedData;

    // set the dimensions and margins of the graph
    var margin = {top: 50, right: 50, bottom: 50, left: 60},
        width = $("#scatterplot").width() - margin.right - 20,
        height = $("#scatterplot").height() - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .range([0, width]);
    

    var xScale2 = d3.scaleLinear()
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .range([height, 0]);

    var yScale2 = d3.scaleLinear()
        .range([height, 0]);

    var xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format("s"));

    var yAxis = d3.axisLeft(yScale);

    var zoom = d3.zoom()
        .scaleExtent([1, 5])
       // .translateExtent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    // tooltip generator
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
        return "<strong>" + convertIOCCodeToName(d.key) + "</strong> with <strong>" + d.value[1] + "</strong> Medals";
    });
    
    if(update){
        var svg = d3.select("#scatterplot");
    } else {
        var svg = d3.select("#scatterplot").append("svg")
            .attr("width", width + margin.right + 20)
            .attr("height", height + margin.top + margin.bottom)
            //.call(zoom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        svg.call(tip);
    }
    d3.queue(2)
        .defer(d3.csv, "csv/world_population_full.csv")
        .defer(d3.csv, "csv/summer_year_country_event.csv")
        .await(function(error, population, countries) {
            if (error) throw error;
            
            else {
                processData(population, countries);
                (update ? updateScatterplot() : drawScatterplot());
            }
        });

        function zoomed() {
            svg.select(".xAxis").call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
            svg.select(".yAxis").call(yAxis.scale(d3.event.transform.rescaleY(yScale)));

            svg.selectAll(".dot").attr("transform", d3.event.transform);
        }

    function processData(population, countries){

        var processedPopulation,
            processedCountries;

        processedPopulation = d3.nest()
            .key(function(d) { return d.CountryCode; })
            .map(population);

        // calculate population average from the interval years
        processedPopulation.each(function(value,key) {
            var populationTotal = 0;
            var counter = 1;
            Object.keys(value[0]).map(e => {
                if((!isNaN(e)) && checkIfYearInInterval(e) && !(isNaN(value[0][e]))){
                    populationTotal = populationTotal + (+value[0][e] - populationTotal) / counter;
                    processedPopulation.set(key, Math.round(populationTotal));
                    counter++;
                }
            })
        });

        // calculate total ammount of medals won in the selected time interval
        processedCountries = d3.nest()
            .key(function(d) { return d.Country; })
            .rollup(function(leaves) {
                    switch(currentLevel) {
                        case 0:
                            return {
                                "TotalMedals" : d3.sum(leaves, function(d) {
                                    if(checkIfYearInInterval(+d.Year)){
                                        return(+d.BronzeCount + +d.SilverCount + +d.GoldCount)
                                    }
                                })
                            };
                            break;
                        case 1:
                            return {
                                "TotalMedals" : d3.sum(leaves, function(d) {
                                    if(checkIfYearInInterval(+d.Year) && d.Sport == sportFilter){
                                        return(+d.BronzeCount + +d.SilverCount + +d.GoldCount)
                                    }
                                })
                            };
                            break;
                        case 2:
                            return {
                                "TotalMedals" : d3.sum(leaves, function(d) {
                                    if(checkIfYearInInterval(+d.Year) && d.Discipline == disciplineFilter){
                                        return(+d.BronzeCount + +d.SilverCount + +d.GoldCount)
                                    }
                                })
                            };
                            break;
                        case 3:
                            return {
                                "TotalMedals" : d3.sum(leaves, function(d) {
                                    if(checkIfYearInInterval(+d.Year) && d.Event == eventFilter){
                                        return(+d.BronzeCount + +d.SilverCount + +d.GoldCount)
                                    }
                                })
                            };
                            break;
                    }
                })
            .map(countries);

        processedData = d3.map();
        processedPopulation.each(function(value,key) {
            processedData.set(String(key), [value, processedCountries.get(String(key)).TotalMedals]);
        });

        //    console.log(processedPopulation.get("POR"));
        //    console.log(processedCountries.get("POR").TotalMedals);

    }
    function drawScatterplot() {
        
        xScale.domain(d3.extent(processedData.entries(), function(d) { return d.value[0]; })).nice();
        yScale.domain(d3.extent(processedData.entries(), function(d) { return d.value[1]; })).nice();

        // x axis
        svg.append("g")
            .attr("class", "xAxis unselectable")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        // text label for the x axis
        svg.append("text")
            .attr("class", "axislabel unselectable")
            .attr("transform", "translate(" + (width / 2) + " ," + 
                                    (height + margin.top - 15) + ")")
            .style("text-anchor", "middle")
            .text("Population");
    
        // y axis
        svg.append("g")
            .attr("class", "yAxis unselectable")
            .call(yAxis);
        
        // text label for the y axis
        svg.append("text")
            .attr("class", "axislabel unselectable")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 5)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Medals");

        svg.selectAll("dot")
            .data(processedData.entries())
            .enter().append("circle")
            .attr("class", "dot") // Assign a class for styling
            .attr("r", function(d) { return (countryFilter.includes(d.key) ? 10 : 5)})
            .attr("opacity", function(d) { return (countryFilter.includes(d.key) ? 1 : 0)})
            .attr("cx", function(d) { return xScale(d.value[0]); })
            .attr("cy", function(d) { return yScale(d.value[1]); })
            .style("fill", function(d) { return color(d.key); })
            .on('mouseover', function(d){
                tip.show(d);
                d3.select(this).transition()
                    .ease(d3.easeElastic)
                    .duration(animationTime)
                    .attr("r", function(d) { return (countryFilter.includes(d.key) ? 15 : 8)})
                    .attr("stroke-width", 2);
            })
            .on('mouseout', function(d){
                tip.hide(d);
                d3.select(this).transition()
                .ease(d3.easeElastic)
                .duration(animationTime)
                .attr("r", function(d) { return (countryFilter.includes(d.key) ? 10 : 5)})
                .attr("stroke-width", 1);
            });
    };

    function updateScatterplot() {

        xScale.domain(d3.extent(processedData.entries(), function(d) { return d.value[0]; })).nice();
        yScale.domain(d3.extent(processedData.entries(), function(d) { return d.value[1]; })).nice();

        svg.select(".yAxis")
            .transition().duration(animationTime)
            .ease(d3.easeExp)
            .call(yAxis); // Create an axis component with d3.axisLeft

        svg.select(".xAxis")
            .transition().duration(animationTime)
            .ease(d3.easeExp)
            .call(xAxis); // Create an axis component with d3.axisLeft

        var dots =svg.selectAll(".dot")
            .data(processedData.entries())

        dots.transition()
            .duration(animationTime)
            .ease(d3.easeExp)
            .attr("r", function(d) { return (countryFilter.includes(d.key) ? 10 : 5)})
            .attr("opacity", function(d) { return (countryFilter.includes(d.key) ? 1 : 0)})
            .attr("cx", function(d) { return xScale(d.value[0]); })
            .attr("cy", function(d) { return yScale(d.value[1]); });
    };
};