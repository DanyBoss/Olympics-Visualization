import React, { useState, useEffect } from "react";
import * as d3 from "d3";

import Header from "../visualizations/Header";
import Bubblechart from "../visualizations/Bubblechart";
import dictionaryDataCsv from "../../data/dictionary.csv";
import countryDataCsv from "../../data/summer_year_country_event.csv";

import "./MainComponent.css";

const MainComponent = () => {
  // Define state to hold data
  const [dictionaryData, setDictionaryData] = useState(null);
  const [countryData, setCountyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch data
  const fetchData = () => {
    Promise.all([d3.csv(dictionaryDataCsv), d3.csv(countryDataCsv)])
      .then(([dictionary, country]) => {
        setDictionaryData(dictionary);
        setCountyData(country);
        setIsLoading(false); // Mark loading as complete
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false); // Mark loading as complete (even if there's an error)
      });
  };

  return (
    <div className="main-container">
      <Header title="Header" />
      <div className="visualizations-container">
        <Bubblechart 
          countryData= {countryData} 
          dictionaryData = {dictionaryData} 
        />
        <div className="worldmap">Worldmap</div>
        <div className="scatterplot">Scatterplot</div>
        <div className="linechart">Linechart</div>
      </div>
    </div>
  );
};

export default MainComponent;
