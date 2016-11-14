// variables for tweaking the responsiveness of the dc.js charts
var maxChartWidth = 750;
var mediumChartWidth = 580;
var smallChartWidth = 440;
var extraSmallChartWidth = 330;
var largeViewportSwitch = 768;
var mediumViewportSwitch = 596;
var smallViewportSwitch = 480;
var choroPlethBaseScale = 990;
var choroPlethBaseOffset = -16;

// make these objects accessible at the global scope so they can be modified or
// filtered by other page controls. (as recommended on dc-js github pages)
// makes things like the reset buttons possible
var timeSelectChart,
    resourceTypeChart,
    povertyLevelChart,
    numberProjectsND,
    totalDonationsND,
    primaryFocusAreaChart,
    gradeLevelChart,
    stateChoropleth,
    selectField,
    donationValueChart,
    schoolsReachedND;

queue()
    .defer(d3.json, "/donorsUS/projects")
    .defer(d3.json, "/data/us_states_geo")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, mapJson) {

    //Grab full state names from map data so we can use them elsewhere
    var stateFullname = [];
    var stateAbbreviation = [];
    for (var i in mapJson.features) {
        stateFullname.push(mapJson.features[i].properties.NAME);
        stateAbbreviation.push(mapJson.features[i].properties.ABBREVIATION);
    }

    //Clean projectsJson data and add in full state names
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"]; // convert to number
        d["school_ncesid"] = +d["school_ncesid"]; // convert to number
        d["school_state_full"] = stateFullname[stateAbbreviation.indexOf(d["school_state"])];
    });

    //Create a Crossfilter instance
    var ndx = crossfilter(donorsUSProjects);

    //Define Dimensions (<8 dimensions is best for performance)
    var dateDim = ndx.dimension(function (d) {
        return d["date_posted"];
    });
    var resourceTypeDim = ndx.dimension(function (d) {
        return d["resource_type"];
    });
    var povertyLevelDim = ndx.dimension(function (d) {
        return d["poverty_level"];
    });
    var stateDim = ndx.dimension(function (d) {
        return d["school_state_full"];
    });
    var primaryFocusAreaDim = ndx.dimension(function (d) {
        return d["primary_focus_area"];
    });
    var gradeLevelDim = ndx.dimension(function (d) {
        return d["grade_level"];
    });
    var totalSchoolsDim = ndx.dimension(function (d) {
        return d["school_ncesid"];
    });

    //Calculate metrics - see https://github.com/square/crossfilter/wiki/API-Reference
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByPrimaryFocusArea = primaryFocusAreaDim.group();
    var numProjectsByGradeLevel = gradeLevelDim.group();

    var totalDonationsByState = stateDim.group().reduceSum(function (d) {
        return d["total_donations"];
    });
    var valueDonationsByDate = dateDim.group().reduceSum(function (d) {
        return d["total_donations"];
    });
    var stateGroup = stateDim.group();

    var all = ndx.groupAll();
    var totalDonations = ndx.groupAll().reduceSum(function (d) {
        return d["total_donations"];
    });

    // pseudo groupAll returns # of unique keys
    var totalSchoolsReached = {
        value: function () {
            return totalSchoolsDim.group().all().filter(function (d) {
                return d.value > 0;
            }).length;
        }
    };

    var max_state = totalDonationsByState.top(1)[0].value;

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];

    // set initial widths based on screen size
    var chartWidth;
    if (matchMedia) {
        var mq1 = window.matchMedia("(min-width: " + largeViewportSwitch + "px)");
        if (mq1.matches) {
            chartWidth = maxChartWidth;
        } else {
            var mq2 = window.matchMedia("(min-width: " + mediumViewportSwitch + "px)");
            if (mq2.matches) {
                chartWidth = mediumChartWidth;
            } else {
                var mq3 = window.matchMedia("(min-width: " + smallViewportSwitch + "px)");
                if (mq3.matches) {
                    chartWidth = smallChartWidth;
                } else {
                    chartWidth = extraSmallChartWidth;
                }
            }
        }
    }

    // choropleth position, scale and projection
    var choroPlethHeight = chartWidth / 1.5;
    var choroPlethZoom = (chartWidth / maxChartWidth) * choroPlethBaseScale;
    var choroPlethOffset = (chartWidth / maxChartWidth) * choroPlethBaseOffset;
    var mapProjection = d3.geo.albersUsa()
        .scale(choroPlethZoom)
        .translate([(chartWidth / 2) + choroPlethOffset, (choroPlethHeight / 2)]);

    // keep the date charts nicely aligned
    var dateDimChartMargins = {top: 30, right: 50, bottom: 25, left: 60};

    // format numbers nicely for human consumption
    var formatCommas = d3.format(",.0f");
    var formatDollarsCommas = d3.format("$,.0f");
    var formatDate = d3.time.format("%B %Y");

    // set colours
    var rowChartColours = ['#aabedc', '#ffb482', '#99d18f', '#ff9998', '#bcabc9', '#bb9c96', '#f1b0c7'];
    var pieChartColours = ['#1f77b4', '#ee6e0d', '#2ca02c', '#d62754'];

    // chart creation
    timeSelectChart = dc.barChart("#time-select-chart");
    resourceTypeChart = dc.rowChart("#resource-type-row-chart");
    povertyLevelChart = dc.pieChart("#poverty-level-chart");
    numberProjectsND = dc.numberDisplay("#number-projects-nd");
    totalDonationsND = dc.numberDisplay("#total-donations-nd");
    primaryFocusAreaChart = dc.rowChart("#primary-focus-area-row-chart");
    gradeLevelChart = dc.pieChart("#grade-level-row-chart");
    stateChoropleth = dc.geoChoroplethChart("#state-choropleth");
    donationValueChart = dc.lineChart("#donation-value-line-chart");
    schoolsReachedND = dc.numberDisplay("#number-schools-nd");


    // Define each of the charts

    selectField = dc.selectMenu('#menu-select')
        .dimension(stateDim)
        .group(stateGroup)
    ;

    donationValueChart
        .width(chartWidth)
        .height(300)
        .renderArea(true)
        .title(function (d) {
            return formatDate(d.key) + ": " + formatDollarsCommas(d.value);
        })
        .transitionDuration(1000)
        .margins(dateDimChartMargins)
        .dimension(dateDim)
        .group(valueDonationsByDate, 'Monthly donations (USD)')
        .yAxisLabel("US Dollars")
        .mouseZoomable(false)
        .ordinalColors(['#41ab5d'])
        .legend(dc.legend().x(120).y(20).itemHeight(13).gap(5))
        .brushOn(false)
        // range chart links its extent with the zoom of the timeSelectChart
        .rangeChart(timeSelectChart)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .yAxis().ticks(8)
    ;

    timeSelectChart
        .width(chartWidth)
        .height(113)
        .margins(dateDimChartMargins)
        .dimension(dateDim)
        .yAxisLabel("Projects")
        .group(numProjectsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(2)
    ;

    numberProjectsND
        .valueAccessor(function (d) {
            return d;
        })
        .group(all)
        .transitionDuration(1000)
        .formatNumber(formatCommas)
    ;

    totalDonationsND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .transitionDuration(1000)
        .formatNumber(formatDollarsCommas)
    ;

    schoolsReachedND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalSchoolsReached)
        .transitionDuration(1000)
        .formatNumber(formatCommas)
    ;

    resourceTypeChart
        .width(360)
        .height(234)
        .title(function (d) {
            return d.key + ": " + formatCommas(d.value);
        })
        .dimension(resourceTypeDim)
        .ordinalColors(rowChartColours)
        .group(numProjectsByResourceType)
        .elasticX(true)
        .xAxis().ticks(4)
    ;

    primaryFocusAreaChart
        .width(360)
        .height(234)
        .title(function (d) {
            return d.key + ": " + formatCommas(d.value);
        })
        .dimension(primaryFocusAreaDim)
        .ordinalColors(rowChartColours)
        .group(numProjectsByPrimaryFocusArea)
        .elasticX(true)
        .xAxis().ticks(4)
    ;

    gradeLevelChart
        .height(234)
        .width(360)
        .radius(100)
        .title(function (d) {
            return d.key + ": " + formatCommas(d.value);
        })
        .transitionDuration(1000)
        .dimension(gradeLevelDim)
        .innerRadius(40)
        .cx(220)
        .cy(117)
        .ordinalColors(pieChartColours)
        .ordering(function (d) {
            if (d.key == "Grades PreK-2") {
                return 0;
            } else if (d.key == "Grades 3-5") {
                return 1;
            } else if (d.key == "Grades 6-8") {
                return 2;
            } else if (d.key == "Grades 9-12") {
                return 3;
            } else
                return 4;
        })
        .label(function (d) {
            if (gradeLevelChart.hasFilter() && !gradeLevelChart.hasFilter(d.key)) {
                return '0%';
            }
            if (all.value()) {
                var label = Math.floor(d.value / all.value() * 100) + '%';
            }
            return label;
        })
        .group(numProjectsByGradeLevel)
        .legend(dc.legend().x(20).y(10).itemHeight(13).gap(5))
    ;

    povertyLevelChart
        .height(234)
        .width(360)
        .radius(100)
        .title(function (d) {
            return d.key + ": " + formatCommas(d.value);
        })
        .innerRadius(40)
        .transitionDuration(1000)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .ordering(function (d) {
            if (d.key == "highest poverty") {
                return 0;
            } else if (d.key == "high poverty") {
                return 1;
            } else if (d.key == "moderate poverty") {
                return 2;
            } else if (d.key == "low poverty") {
                return 3;
            }
        })
        .label(function (d) {
            if (povertyLevelChart.hasFilter() && !povertyLevelChart.hasFilter(d.key)) {
                return '0%';
            }
            if (all.value()) {
                var label = Math.floor(d.value / all.value() * 100) + '%';
            }
            return label;
        })
        .cx(220)
        .cy(117)
        .ordinalColors(pieChartColours)
        .legend(dc.legend().x(20).y(10).itemHeight(13).gap(5))
    ;

    stateChoropleth
        .width(chartWidth)
        .height(choroPlethHeight)
        .projection(mapProjection)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .overlayGeoJson(mapJson.features, "school_state_full", function (d) {
            return d.properties.NAME;
        })
        .colors(d3.scale.quantize().range(['#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c']))
        .colorDomain([0, max_state / 2])
        .title(function (d) {
            return d.key + "\nMoney raised: " + formatDollarsCommas((d.value ? d.value : 0));
        })
    ;

    dc.renderAll();

    // obscure page with 'Loading...' until it's ready
    d3.select("#loading-data").attr("hidden", "");

    // set title to reflect applied state filters
    stateChoropleth.on('filtered', function () {
        if (stateChoropleth.filters().length == 0) {
            d3.select("#stateFilter").text("All states");
        } else if (stateChoropleth.filters().length <= 3) {
            d3.select("#stateFilter").text(stateChoropleth.filters().join(', '));
        } else {
            d3.select("#stateFilter").text(stateChoropleth.filters().length + " states");
        }
    });

    // update choropleth filters when user uses the menu instead
    selectField.on('filtered', function () {
        stateChoropleth.filterAll();
        if (selectField.filters().length == 0) {
            d3.select("#stateFilter").text("All states");
        } else {
            d3.select("#stateFilter").text(selectField.filters());
            stateChoropleth.filter(selectField.filters());
        }
    });

    // listen for browser resize
    $(window).on("resize", resizeWideCharts);

    // listen for orientation change
    var mq = window.matchMedia("(orientation: portrait)");
    mq.addListener(function(m) {
        resizeWideCharts();
    });

    // test if the browser resize needs a chart resize
    function resizeWideCharts(){
        var winWidth = $(window).width();
        if (winWidth < smallViewportSwitch && chartWidth != extraSmallChartWidth){
            chartResize(extraSmallChartWidth);
        } else if (winWidth >= smallViewportSwitch && winWidth < mediumViewportSwitch && chartWidth != smallChartWidth){
            chartResize(smallChartWidth);
        } else if (winWidth >= mediumViewportSwitch && winWidth < largeViewportSwitch && chartWidth != mediumChartWidth){
            if (chartWidth == maxChartWidth) {
                dc.filterAll(); // this is the switch from interactive chart to menu selection
            }
            chartResize(mediumChartWidth);
        } else if (winWidth >= largeViewportSwitch && chartWidth != maxChartWidth){
            chartResize(maxChartWidth);
        }
    }

    // do the chart resize
    function chartResize(width) {
        console.log(width);
        choroPlethHeight = width / 1.5;
        choroPlethZoom = (width / maxChartWidth) * choroPlethBaseScale;
        choroPlethOffset = (width / maxChartWidth) * choroPlethBaseOffset;
        mapProjection = d3.geo.albersUsa()
            .scale(choroPlethZoom)
            .translate([(width / 2) + choroPlethOffset, (choroPlethHeight / 2)]);
        stateChoropleth
            .width(width)
            .height(choroPlethHeight)
            .projection(mapProjection);
        donationValueChart
            .width(width);
        timeSelectChart
            .width(width);
        chartWidth = width;
        timeSelectChart.rescale();
        dc.renderAll();
    }

}
