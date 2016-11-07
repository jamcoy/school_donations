// make these objects accessible at the global scope so they can be modified or
// filtered by other page controls. (as recommended on dc-js github pages)
// makes things like the reset buttons possible

var timeChart,
    resourceTypeChart,
    povertyLevelChart,
    numberProjectsND,
    totalDonationsND,
    fundingStatusChart,
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

    //Grab full state names from map data so we can use them on the choropleth
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

   //Define Dimensions
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
   var totalDonationsDim = ndx.dimension(function (d) {
       return d["total_donations"];
   });
   var fundingStatus = ndx.dimension(function (d) {
       return d["funding_status"];
   });
    var primaryFocusAreaDim = ndx.dimension(function (d) {
        return d["primary_focus_area"];
    });
    var gradeLevelDim = ndx.dimension(function (d) {
        return d["grade_level"];
    });
    var totalSchoolsDim = ndx.dimension(function (d){
        return d["school_ncesid"];
    });

   //Calculate metrics - see https://github.com/square/crossfilter/wiki/API-Reference
   var numProjectsByDate = dateDim.group();
   var numProjectsByResourceType = resourceTypeDim.group();
   var numProjectsByPovertyLevel = povertyLevelDim.group();
   var numProjectsByFundingStatus = fundingStatus.group();
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
            value: function() {
                return totalSchoolsDim.group().all().filter(function(d) {
                   return d.value > 0;
                }).length;
            }
        };

   var max_state = totalDonationsByState.top(1)[0].value;

   //Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["date_posted"];
   var maxDate = dateDim.top(1)[0]["date_posted"];

    var width = 800,
        height = 540;

    var mapProjection = d3.geo.albersUsa()
        .scale(1050)
        .translate([(width / 2) - 20, (height / 2) - 30]); // 30 leaves a little space for a legend

    // keep the date charts nicely aligned
    var dateDimChartMargins = {top: 30, right: 50, bottom: 25, left: 60};

    var formatCommas = d3.format(",.0f");
    var formatDollarsCommas = d3.format("$,.0f");
    var formatDate = d3.time.format("%B %Y");

   //Charts
   timeChart = dc.barChart("#time-chart");
   resourceTypeChart = dc.rowChart("#resource-type-row-chart");
   povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
   numberProjectsND = dc.numberDisplay("#number-projects-nd");
   totalDonationsND = dc.numberDisplay("#total-donations-nd");
   fundingStatusChart = dc.pieChart("#funding-chart");
   primaryFocusAreaChart = dc.rowChart("#primary-focus-area-row-chart");
   gradeLevelChart = dc.pieChart("#grade-level-row-chart");
    stateChoropleth = dc.geoChoroplethChart("#state-choropleth");
    donationValueChart = dc.lineChart("#donation-value-line-chart");
    schoolsReachedND = dc.numberDisplay("#number-schools-nd");

   selectField = dc.selectMenu('#menu-select')
       .dimension(stateDim)
       .group(stateGroup)
   ;

    donationValueChart
        .renderArea(true)
        .width(800)
        .height(389)
        .title(function (d) { return formatDate(d.key) + ": " + formatCommas(d.value); })
        .transitionDuration(500)
        .margins(dateDimChartMargins)
        .dimension(dateDim)
        .group(valueDonationsByDate)
        .mouseZoomable(false)
        .brushOn(false)
        // range chart links its extent with the zoom of the timeChart
        .rangeChart(timeChart)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .xAxisLabel("Year")
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .yAxis().ticks(8)
    ;

     timeChart
       .width(800)
       .height(234)
       .margins(dateDimChartMargins)
       .dimension(dateDim)
       .group(numProjectsByDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .xAxisLabel("Year")
     .renderHorizontalGridLines(true)
       .yAxis().ticks(8)
    ;

    numberProjectsND
       //.formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(all)
        .transitionDuration(1000)
        .formatNumber(formatCommas)
    ;

   totalDonationsND
       //.formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(totalDonations)
       .transitionDuration(1000)
       .formatNumber(formatDollarsCommas)
   ;

    schoolsReachedND
       //.formatNumber(d3.format("d"))
   .valueAccessor(function (d) {
           return d;
       })
       .group(totalSchoolsReached)
        .transitionDuration(1000)
       .formatNumber(formatCommas)
   ;

   resourceTypeChart
       .width(380)
       .height(234)
       .title(function (d) { return d.key + ": " + formatCommas(d.value); })
       .dimension(resourceTypeDim)
       .group(numProjectsByResourceType)
       .elasticX(true)
       .xAxis().ticks(4)
   ;

   primaryFocusAreaChart
       .width(380)
       .height(234)
      .title(function (d) { return d.key + ": " + formatCommas(d.value); })
       .dimension(primaryFocusAreaDim)
       .group(numProjectsByPrimaryFocusArea)
       .elasticX(true)
       .xAxis().ticks(4)

   ;

   gradeLevelChart
        .height(234)
       .width(380)
       .radius(90)
       .title(function (d) { return d.key + ": " + formatCommas(d.value); })
       .transitionDuration(1000)
       .dimension(gradeLevelDim)
       .innerRadius(40)
       .cx(220)
       .cy(117)
       .ordering(function(d) {
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
       .width(380)
       .height(234)
       .title(function (d) { return d.key + ": " + formatCommas(d.value); })
       .dimension(povertyLevelDim)
       .group(numProjectsByPovertyLevel)
       .elasticX(true)
      .ordering(function(d) {
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
       .xAxis().ticks(4)
   ;
 
   fundingStatusChart
       .height(234)
       .width(380)
       .radius(90)
       .title(function (d) { return d.key + ": " + formatCommas(d.value); })
       .innerRadius(40)
       .transitionDuration(1000)
       .dimension(fundingStatus)
      .cx(220)
       .cy(117)
       .group(numProjectsByFundingStatus)
        .legend(dc.legend().x(20).y(10).itemHeight(13).gap(5))
   ;

    stateChoropleth
        .width(800)
        .height(540)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .overlayGeoJson(mapJson.features, "school_state_full", function (d) {
            return d.properties.NAME;
        })
        .projection(mapProjection)
        .colors(d3.scale.quantize().range(['#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4']))
        .colorDomain([0, max_state / 8])
        .title(function (d) {
            return d.key + "\nMoney raised: " + formatDollarsCommas((d.value ? d.value : 0));
        })
    ;

   dc.renderAll();

    stateChoropleth.on('filtered', function() {
        if (stateChoropleth.filters().length == 0){
            d3.select("#stateFilter").text("All states");
        } else if (stateChoropleth.filters().length <= 4){
            d3.select("#stateFilter").text(stateChoropleth.filters().join(', '));
        } else {
            d3.select("#stateFilter").text(stateChoropleth.filters().length + " states");
        }
    });

    // This media query event handler will reset filters when crossing bootstrap sm size
    // States are filtered by map on big screens and a menu on small screens, which apply filters slightly differently
    if (matchMedia) {
      var mq = window.matchMedia("(min-width: 768px)");
      mq.addListener(function() {
          dc.filterAll();
          dc.renderAll();
      });
    }

}
