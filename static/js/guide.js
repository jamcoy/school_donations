function startGuide() {
    var tour = introJs();
    tour.setOption('tooltipPosition', 'auto');
    tour.setOption('positionPrecedence', ['left', 'right', 'bottom', 'top']);
    var tourGuide = {
        "steps": [
            {
                intro: "<b>Introduction</b><br/>This dashboard is built using d3.js, d3-queue, dc.js, Crossfilter, Bootstrap, Flask, MongoDB, Dashboards by Keen IO and Intro.js.<br/><br/>The dataset has been taken from DonorsChoose.org; a US-based public charity providing a platform for fundraising for schools.<br/><br/>Click next for a guided tour of the features."
            },
            {
                element: "#tourStep1",
                intro: "<b>US State Selection Menu</b><br/>Filter the data by state using this drop-down menu.  If you switch to a wider screen (try rotating your device), or increase the width of your browser, the map will become interactive."
            },
            {
                element: "#tourStep2",
                intro: "<b>Headline Figures</b><br/>These headline figures provide an overview of the filtered data."
            },
            {
                element: "#tourStep3",
                intro: "<b>Distribution by State</b><br/>The colours on the choropleth show how many dollars the states have donated compared to one another.<br/><br/><b>Interaction (larger screens only)</b></br>Click one or more states on the choropleth to filter data.  Click the same state again to remove the filter, or by clicking 'reset'.<br/>Hover your mouse for details of each state's donations."
            },
            {
                element: "#tourStep4",
                intro: "<b>Donations and Projects by Date</b><br/>The top area chart shows the total monetary value of donations by calendar month.  The bottom bar chart shows total projects by calendar month.<br/><br/>Click and drag your mouse across the project bar chart to zoom into a specific date range.<br/>Clear the filter by clicking 'reset'."
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
                intro: "<b>Projects by Poverty Level</b><br/>This donut chart shows the donation distribution by poverty level.  Click any slice to filter the data.  Click the same slice again to remove the filter, or click 'reset' in the top right corner to remove all 'poverty level' filters."
            },
            {
                element: "#tourStep8",
                intro: "<b>Projects by Grade Level</b><br/>This pie chart shows the donation distribution by student grade level."
            }
        ]
    };

    // skip steps that are hidden due to media queries
    if (matchMedia) {
        var mq = window.matchMedia("(min-width: 768px)");
        if (mq.matches) {
            tourGuide.steps.splice(1, 1); // state menu selector
        } else {
            //tourGuide.steps.splice(3, 1); // choropleth
        }
    }
    tour.setOptions(tourGuide);
    tour.start();
}