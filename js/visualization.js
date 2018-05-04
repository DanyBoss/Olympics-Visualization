// global variables
var selectedNode = null,
    currentState = 0,   // defines the deepness we're seeing in the vis (All = 0, Sport = 1; Discipline = 2; Event = 3)
    countrySelection = [null, null, null, null],
    countryLineIdentifier = [[null, 0], [null, 1], [null, 2], [null, 3]],
    sportFilter = "All",
    disciplineFilter = "All",
    eventFilter = "All",
    initialYearFilter = 1896,
    endYearFilter = 2012,
    currentFilterKeyword = "Sport",
    countryNameDictionary = {},
    iocCodeDictionary = {};


// colors used throughout the visualization
var eventsColors = d3.scaleOrdinal(d3.schemeSet3),
    countryColors = ["#fb8072", "#ffffb3", "#8dd3c7", "#bebada"];

// array containing the years in which summer olympics occurred
var years = [1896, 1900, 1904, 1908, 1912, 1920, 1924, 1928, 1932, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012]

// animation variables
var animationTime = 750;

// set a reload function on window resize
window.onresize = function(){ location.reload(); }

// First visualization drawing.
$(document).ready(function() {

    // Make the Dictionary Loader run asynchronously
    var callback = $.Deferred();
    loadDictionary(callback);

    callback.done(function() {
        updateDashboardState(0,true);
    });
    
});

/**
 * Main function that does the updates the visualization requires
 * @param {number} nextState - next state in the visualization (-1, 0, 1), see comment about 
 * currentState for further information
 * @param {boolean} initialUpdate - flag determining if its the first update (default = false)
 * @param {boolean} linechartRefresh - flag determining if the linechart should refresh (for catching
 * ctrl+click on map, default = false)
*/
function updateDashboardState(nextState, initialUpdate = false, linechartRefresh = false) {

    switch(nextState){
        case -1:
            if(++currentState > 3) {
                currentState = 3;
                return;
            }
            break;
        case 1:
            if(--currentState < 0) {
                currentState = 0;
                return;
            }
            break;
    }

    if(initialUpdate) {
        TimeSlider.initialize();

        Bubblechart.initialize();
        WorldMap.initialize();
        Linechart.initialize();
        Scatterplot.initialize();

    } else {
        Bubblechart.update();
        Linechart.update(linechartRefresh);
        Scatterplot.update();
    }

    let yearsText = 
        (endYearFilter == initialYearFilter ? 
            " in <strong>" + initialYearFilter + "</strong>" :
            " from <strong>" +  initialYearFilter + "</strong> to <strong>" + endYearFilter + "</strong>"
        );
    let countriesSection = countrySelectionToString();

    switch(currentState) {
        case 0:
            sportFilter = "All";
            currentFilterKeyword = "Sport";
            $('#statelabel').html(
                countriesSection + " on <strong> every Event </strong>" + yearsText
            );
            $('#back-icon-container').hide();
            break;

        case 1:
            sportFilter = selectedNode.Sport;
            currentFilterKeyword = "Discipline";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + sportFilter + "</strong>" + yearsText
            );
            $('#back-icon-container').show();
            $('#back-subtitle').text("All");
            break;

        case 2:
            disciplineFilter = selectedNode.Discipline;
            currentFilterKeyword = "Event";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + disciplineFilter + "</strong>" + yearsText
            );
            $('#back-subtitle').text(sportFilter);
            break;

        case 3:
            eventFilter = selectedNode.Event;
            currentFilterKeyword = "Event";
            $('#statelabel').html(
                countriesSection  + " on <strong>" + eventFilter + "</strong>" + yearsText
            );
            $('#back-subtitle').text(disciplineFilter);
            break;
    }
}


/** 
 * Initializes the internal dicionary objects
 */
var loadDictionary = function(callback) {
    d3.csv("csv/dictionary.csv").then(function(data){

        for (let i = 0; i < data.length; i++) {
            countryNameDictionary[data[i].CountryName] = data[i].CountryCode;
        }

        for (let i = 0; i < data.length; i++) {
            iocCodeDictionary[data[i].CountryCode] = data[i].CountryName;
        }

         randomizeInitialCountry(data, "FRA");

         callback.resolve();
    })
};

/** 
 * Selects a random country to be the initial selected 
 * 
 * @param {array} array - Array containing a CountryName <-> CountryCode relationship
 * (see loadDictionary())
 * @param {array} initialCountryCode - IOC Code of the country to be the initial one,
 * optional paramenter defaults to null, no checks are made to this parameter
 */
function randomizeInitialCountry(array, initialCountryCode = null) {
    
    let randomCountryCode;
    
    if(initialCountryCode === null) {
        randomCountryCode = array[Math.floor(Math.random() * array.length)].CountryCode;
    } else {
        randomCountryCode = initialCountryCode;
    }

    countrySelection = [randomCountryCode, null, null, null];
    countryLineIdentifier = [[randomCountryCode, 0], [null, 1], [null, 2], [null, 3]];
}

/** 
 * Converts a country name to the IOC code 
 * 
 * @param {string} countryName - Name to be converted to a IOC Code
 * @returns {string} IOC Code or -1 if name doesn't exist in dictionary
 */
function convertNameToIOCCode(countryName) {
    if(countryNameDictionary[countryName]) {
        return countryNameDictionary[countryName];
    } else {
        return -1;
    }
}
/** 
 * converts a IOC code to the country name 
 * @param {string} code - IOC Code to be converted into a country name
 * @returns {string} Country Name or -1 if code doesn't exist in dictionary
 */
function convertIOCCodeToName(code) {
    if(iocCodeDictionary[code]) {
        return iocCodeDictionary[code]; 
    } else {
        return -1;
    }
}

/** 
 * Returns the number of countries currently in the selection
 * (basically not null values)
 * @returns {number} Number of countries (from 1 to 4)
 */
function getNumberOfCountriesInSelection() {
	let number = 0;
	countrySelection.forEach(function(element) {
		if(element === null) {
            number++;
        }	
	})
	return countrySelection.length - number;
}

/** 
 * Returns the first free position in the countrySelection array
 * @returns {number} Open Position or -1 if there is none
 */
function getFirstOpenPositionInSelection() {
	for(let i = 0; i<countrySelection.length; i++) {
		if(countrySelection[i] === null) {
			return i;
        }
	}
	return -1;
}

/** 
 * Converts the countrySelection variable to something a 
 * human can read, with some html marking
 * 
 * *"country1, country2 and country3"*
 * 
 * @returns {string} String
 */
function countrySelectionToString() {
    
    let result = "",            
        counter = 0;

    // Cicle through the countries in countrySelection.
    for(let i = 0; i < countrySelection.length; i++) {
        
		if(countrySelection[i] === null) {
            continue;
        }

        result += "<strong>" + convertIOCCodeToName(countrySelection[i]) + "</strong>";
        counter++;

        switch(getNumberOfCountriesInSelection() - counter) {
            case 0:
                result += "";
                break;

            case 1:
                result += " and ";
                break;

            default:
                result += ", "
                break;
        }
    }
    return result;
}

/** 
 * Changes the currently selected country to a new one
 * 
 * @param {string} countryName - Name of the new country
 */
function changeSelectedCountry(countryName){
	var iocCode = convertNameToIOCCode(countryName);

    countrySelection = [String(iocCode), null, null, null];

    updateDashboardState(0, false, true);
};

/** 
 * Adds a new country to the current selection
 * 
 * @param {string} countryName - Name of the country to be added
 */
function addCountryToSelection(countryName){

	countrySelection[getFirstOpenPositionInSelection()] = String(convertNameToIOCCode(countryName));

    updateDashboardState(0);
}

/** 
 * Removes a country to the current selection
 * 
 * @param {string} countryName - Name of the country to be removed
 */
function removeCountryFromSelection(countryName){
	var iocCode = convertNameToIOCCode(countryName);
	countrySelection[countrySelection.indexOf(String(iocCode))] = null;

    removeLineID(iocCode);

    updateDashboardState(0);
}

/** 
 * Clears the array of LineIDs (for the linechart),
 * and also hides all the lines
 */
function clearLineIDArray(){
    for(i = 0; i < countryLineIdentifier.length; i++){
        countryLineIdentifier[i][0] = null;
        Linechart.hideLine(i);
    }
}

/** 
 * Gets the lineID of the country with the given IOC Code
 * 
 * @param {string} iocCode - Code of the country to search for
 * @return {number} ID or -1 if it doesn't find the country with the given IOC code
 */
function getLineID(iocCode){
    for(i = 0; i < countryLineIdentifier.length; i++){
        if(countryLineIdentifier[i][0] === iocCode){
            return i;
        }
    }
    return -1;
}

/** 
 * Sets the country with the give IOC Code in the first 
 * free open position in the array that controls linechart lines
 * @param {string} iocCode - IOC Code of the country
 * 
 * @return {number} position that was set or -1 if array was full (and wasn't modified)
 * 
 */
function setNextFreeLineID(iocCode){
    for(i = 0; i < countryLineIdentifier.length; i++){
        if(countryLineIdentifier[i][0] === null){
			setLineID(iocCode, i);
			Linechart.showLine(i);
            return i;
        }
    }
    return -1;
}

function removeLineID(country){
    Linechart.hideLine(getLineID(country));
    countryLineIdentifier[getLineID(country)][0] = null;
}

function setLineID(country, id){
    countryLineIdentifier[id] = [country, id]
}

function changeTimeline(begin, end){
    //check if a update is necessary
    if(initialYearFilter != years[Math.round(begin)] || endYearFilter != years[Math.round(end)] ){
        initialYearFilter = years[Math.round(begin)];
        endYearFilter = years[Math.round(end)];
    
        updateDashboardState(0);
    }
};

function checkIfTimelineIsBetween(begin, end){
    return (begin <= initialYearFilter && end >= initialYearFilter && begin <= endYearFilter &&  end >= endYearFilter);
}

//function assumes we never use a year outside of year array
function checkIfYearInInterval(year){
    return (year >= initialYearFilter && year <= endYearFilter);
};

//function to get a CSS variable from the CSS
function getCSSColor(variable){
    return getComputedStyle(document.body).getPropertyValue(variable);
};

// descending filter compararation function
function descending(a,b) { return a.key - b.key };

/**
 * Returns a color from a set array of 4, used to color countries throughout the visualization
 * @param {*} countryCode String containing the country code
 */
function getColor(countryCode) {
    var index =  countrySelection.findIndex(el => el === countryCode);

    if(index == -1) {
        return "D2D4D3";
    } else {
        return countryColors[index];
    }
}