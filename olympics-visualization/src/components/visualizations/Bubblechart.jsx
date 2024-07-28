import React, { useRef, useEffect } from "react";
import "./Bubblechart.css";
import * as d3 from "d3";

const Bubblechart = ({ dictionaryData, countryData }) => {

  const svgRef = useRef();
  console.log("this is bubblechart");

  useEffect(() => {
    console.log("inside effect");

    if (!dictionaryData || !countryData) {
      // No data available yet, do nothing
      return;
    }
    var rect = svgRef.current.getBoundingClientRect();

    // D3 code to initialize bubble chart
    const minBubbleSize = 10,
      maxBubbleSize = 70,
      offsetBetweenBubbles = 5,
      width = rect.width,
      height = rect.height;

    // Filter the data, first by year and then by Country
    let filteredData = countryData.filter((d, i) => {
      return d;
    });

    // create a new array with adding up information from different years of the olympics using a specified filter
    let processedData = [];

    filteredData.forEach((d) => {
      //if the data doesn't exist in the processed array, create it
      processedData[processedData.length] = {
        Country: d.Country,
        Sport: d.Sport,
        Discipline: d.Discipline,
        Event: d.Event,
        GoldCount: d.GoldCount,
        SilverCount: d.SilverCount,
        BronzeCount: d.BronzeCount,
        TotalMedals: d.TotalMedals,
      };
    });

    // Make bigger bubbles stay on the outside.
    processedData.sort((a, b) => b.TotalMedals < a.TotalMedals);

    const svg = d3.select(svgRef.current);
    const radiusScale = d3.scaleSqrt();
    const simulation = d3
      .forceSimulation()
      .force(
        "x",
        d3
          .forceX(width)
          .strength(0.05)
          .x(width / 2)
      )
      .force(
        "y",
        d3
          .forceY(height)
          .strength(0.05)
          .y(height / 2)
      )
      .force(
        "center_force",
        d3
          .forceCenter()
          .x(width / 2)
          .y(height / 2)
      )
      .force("charge", d3.forceManyBody().strength(-15));

    // Cleanup previous view.
    svg.selectAll(".bubble").remove();

    // Bubble container.
    let bubbleGroup = svg
      .selectAll(".bubble")
      .data(processedData)
      .enter()
      .append("g")
      .attr("class", "bubble");

    let bubble = bubbleGroup
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("stroke-width", "2")
      .on("mouseover", function (d) {
        d3.select(this)
          .transition()
          .ease(d3.easeElastic)
          .style("cursor", "pointer");
      })
      .on("mouseout", function (d) {
        d3.select(this)
          .transition()
          .ease(d3.easeElastic)
          .style("cursor", "default");
      })
      .on("click", (d) => {
      })
      .call(
        d3
          .drag()
      );

    // Bubble Text Labels.
    let labels = bubbleGroup
      .append("text")
      .attr("class", "label unselectable")
      .text((d) => {
        // If the bubble is too small simply hide the text.
        if (radiusScale(d.TotalMedals) < 18) {
          return "";
        }
        // If not calculate if it's necessary to substring the title.
        return d.Country;
        
      });
  }, [countryData]);

  // Render bubblechart using data
  return <svg id="bubblechart" ref={svgRef}></svg>;
};

export default Bubblechart;
