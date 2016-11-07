function startGuide() {
    var tour = introJs();
    tour.setOption('tooltipPosition', 'auto');
    tour.setOption('positionPrecedence', ['left', 'right', 'bottom', 'top']);
    var tourGuide = {
        "steps": [
            {
                intro: "<b>Introduction</b><br/>This dashboard is built using d3.js, dc.js, crossfilter, bootstrap, flask blah blah.  Click next for a guided tour of the features."
            },
            {
                element: "#tourStep0",
                intro: "<b>Reset All Button</b><br/>A number of filters can be applied to the dataset.  To remove all the filters at any time, click the 'Reset all' button.  Each chart has its own reset button in the top right corner for resetting filters applied using the respective chart."
            },
            {
                element: "#tourStep1",
                intro: "<b>US State Selection Menu</b><br/>Filter the data by state using this drop-down menu.  If you switch to a larger screen, or increase the width of your browser, this menu will be replaced by an interactive map."
            },
            {
                element: "#tourStep2",
                intro: "<b>Headline Figures</b><br/>These headline figures provide an overview of the filtered data."
            },
            {
                element: "#tourStep3",
                intro: "<b>Distribution by State</b><br/>The colours on the choropleth show how much the states have donated compared to one another.  Click one or more states on the choropleth to filter data.  Click the same state again to remove the filter.  Hover your mouse for details of each state's donations.<br/>On a small screen, the map will be replaced by a menu."
            },
            {
                element: "#tourStep4",
                intro: "<b>Donations and Projects by Date</b><br/>Click and drag your mouse across the project bar chart (the lower of the two charts) to zoom into a specific date range."
            },
            {
                element: "#tourStep5",
                intro: "<b>Projects by Resource Type</b><br/>This row chart shows the donation distribution by resource type.  Click any row to filter the data.  Click the same row again to remove the filter, or click 'reset' in the top right corner to remove all 'resource type' filters."
            },
            {
                element: "#tourStep6",
                intro: "<b>Projects by Primary Focus Area</b><br/>This row chart shows the donation distribution by primary focus area."
            },
            {
                element: "#tourStep7",
                intro: "<b>Projects by Poverty Level</b><br/>This pie chart shows the donation distribution by poverty level.  Click any sector to filter the data.  Click the same sector again to remove the filter, or click 'reset' in the top right corner to remove all 'poverty level' filters."
            },
            {
                element: "#tourStep8",
                intro: "<b>Introduction</b><br/>This pie chart shows the donation distribution by student grade level."
            }
        ]
    };

    // skip steps that are hidden due to media queries
    if (matchMedia) {
        var mq = window.matchMedia("(min-width: 768px)");
        if (mq.matches) {
            tourGuide.steps.splice(2, 1); // state menu selector
        } else {
            tourGuide.steps.splice(4, 1); // choropleth
        }
    }
    tour.setOptions(tourGuide);
    tour.start();
}