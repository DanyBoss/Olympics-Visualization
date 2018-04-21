// generates the timeSlider in the vis
function genTimeSlider() {
    var margin = {top: 10, right: 50, bottom: 10, left: 30}
        width = $("#timeslider").width(),
        height = $("#timeslider").height();

    var selectedHandle = null;

    var xScale = d3.scaleLinear()
        .domain([0, years.length-1])
        .range([0, width-margin.left])
        .clamp(true);

    // make an SVG Container
    var svg = d3.select("#timeslider").append("svg")
        .attr("width", width)
        .attr("height", height);

    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(15,15)");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xScale.range()[0])
        .attr("x2", xScale.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("drag", function () { 
                target = round(xScale.invert(d3.event.x));
                if(selectedHandle === null){
                    (Math.abs(target - xScale.invert(handle1.attr("cx"))) < Math.abs(target - xScale.invert(handle2.attr("cx"))) ?
                        selectedHandle = handle1 :
                        selectedHandle = handle2);
                }
                moveHandleDumb(target);
            })
            .on("end", function () {
                // reset radius of selected handle
                handle1.attr("r", 8);
                handle2.attr("r", 8);
                
                // if both handles are the same year make them bigger
                if(handle1.attr("cx") == handle2.attr("cx")){
                    handle1.attr("r", 12);
                    handle2.attr("r", 12);
                }

                selectedHandle = null;

                // update global time variable
                (Math.round(handle1.attr("cx")) <= Math.round(handle2.attr("cx")) ?
                    changeTimeline(xScale.invert(handle1.attr("cx")), xScale.invert(handle2.attr("cx"))) :
                    changeTimeline(xScale.invert(handle2.attr("cx")), xScale.invert(handle1.attr("cx")))
                );
            })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks unselectable")
        .attr("transform", "translate(0," + 20 + ")")
        .selectAll("text")
        .data(xScale.ticks(years.length-1))
        .enter().append("text")
        .attr("x", xScale)
        .attr("text-anchor", "middle")
        .text(function (d) { return years[d]; });

    var handle1 = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 8)
        .attr("cx", xScale(0));

    var handle2 = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 8)
        .attr("cx", xScale(27));

    function moveHandleDumb(target){
        selectedHandle.attr("r", 10)
            .attr("cx", xScale(target));
    }

    function round(xScale) {
        (xScale % 1 >= 0.5 ? xScale = Math.ceil(xScale) : xScale = Math.floor(xScale))
    return xScale;
    }
};

