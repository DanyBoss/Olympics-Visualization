import React, { useRef, useEffect } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { yearFilterState, yearsState } from "../../recoil/atoms";
import { filteredYearsState } from "../../recoil/selectors";
import * as d3 from "d3";
import "./Header.css";

const Header = () => {
  const svgRef = useRef();
  const [yearFilter, setYearFilter] = useRecoilState(yearFilterState);
  const years = useRecoilValue(yearsState);
  const filteredYears = useRecoilValue(filteredYearsState);

  useEffect(() => {
    var rect = svgRef.current.getBoundingClientRect();

    // array containing the years in which summer olympics occurred
    const margin = { top: 10, right: 50, bottom: 10, left: 30 },
      width = rect.width,
      height = rect.height;

    const slider = d3
      .select(svgRef.current)
      .append("g")
      .attr("class", "slider")
      .attr("transform", "translate(15,15)");

    const xScale = d3
      .scaleLinear()
      .domain([0, years.length - 1])
      .range([0, width - margin.left])
      .clamp(true);

    let selectedHandle = null;

    // make an SVG Container
    slider
      .append("line")
      .attr("class", "track")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1])
      .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-inset")
      .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-overlay")
      .call(
        d3
          .drag()
          .on("drag", (event, d) => {
            let target = round(xScale.invert(event.x));
            if (selectedHandle === null) {
              Math.abs(target - xScale.invert(handle1.attr("cx"))) <
              Math.abs(target - xScale.invert(handle2.attr("cx")))
                ? (selectedHandle = handle1)
                : (selectedHandle = handle2);
            }
            moveHandle(target);
          })
          .on("end", (d) => {
            // reset radius of selected handle
            handle1.attr("r", 8);
            handle2.attr("r", 8);

            // if both handles are the same year make them bigger
            if (handle1.attr("cx") === handle2.attr("cx")) {
              handle1.attr("r", 12);
              handle2.attr("r", 12);
            }

            selectedHandle = null;

            // update global time variable
            Math.round(handle1.attr("cx")) <= Math.round(handle2.attr("cx"))
              ? setYearFilter({
                  start: xScale.invert(handle1.attr("cx")),
                  end: xScale.invert(handle2.attr("cx")),
                })
              : setYearFilter({
                  start: xScale.invert(handle2.attr("cx")),
                  end: xScale.invert(handle1.attr("cx")),
                });
          })
      );

    slider
      .insert("g", ".track-overlay")
      .attr("class", "ticks unselectable")
      .attr("transform", "translate(0," + 20 + ")")
      .selectAll("text")
      .data(xScale.ticks(years.length - 1))
      .enter()
      .append("text")
      .attr("x", xScale)
      .attr("text-anchor", "middle")
      .text((d) => years[d]);

    const handle1 = slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(0));

    const handle2 = slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(27));

    function moveHandle(target) {
      selectedHandle.attr("r", 10).attr("cx", xScale(target));
    }

    function round(xScale) {
      xScale = xScale % 1 >= 0.5 ? Math.ceil(xScale) : Math.floor(xScale);
      return xScale;
    }

    // Cleanup function
    return () => {
      // Remove appended HTML when component unmounts
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="header">
      <span id="statelabel" className="unselectable">
        <strong>Bubacar</strong> on <strong>{yearFilter.start}</strong> to <strong>{yearFilter.end}</strong>
      </span>
      <svg id="timeslider" ref={svgRef} />
      <span className="subtitle unselectable">Olympics Visualization - Made with ❤️</span>
    </div>
  );
};

export default Header;
