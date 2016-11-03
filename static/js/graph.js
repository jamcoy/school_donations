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
    stateChoropleth;

var stateFullname = [];
var stateAbbreviation = [];

queue()
   .defer(d3.json, "/donorsUS/projects")
    .defer(d3.json, "/data/us_states_geo")
   .await(makeGraphs);
 
function makeGraphs(error, projectsJson, mapJson) {

    //Grab full state names from map data so we can use them to augment the donation data
    var mapData = mapJson.features;
    for (var i in mapData) {
        stateFullname.push(mapData[i].properties.NAME);
        stateAbbreviation.push(mapData[i].properties.ABBREVIATION);
    }
 
   //Clean projectsJson data and add in full state names
   var donorsUSProjects = projectsJson;
   var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
   donorsUSProjects.forEach(function (d) {
       d["date_posted"] = dateFormat.parse(d["date_posted"]);
       d["date_posted"].setDate(1);
       d["total_donations"] = +d["total_donations"];
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
       return d["school_state"];
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


   //Calculate metrics
   var numProjectsByDate = dateDim.group();
   var numProjectsByResourceType = resourceTypeDim.group();
   var numProjectsByPovertyLevel = povertyLevelDim.group();
   var numProjectsByFundingStatus = fundingStatus.group();
    var numProjectsByPrimaryFocusArea = primaryFocusAreaDim.group();
    var numProjectsByGradeLevel = gradeLevelDim.group();
   var totalDonationsByState = stateDim.group().reduceSum(function (d) {
       return d["total_donations"];
   });
   var stateGroup = stateDim.group();

   var all = ndx.groupAll();
   var totalDonations = ndx.groupAll().reduceSum(function (d) {
       return d["total_donations"];
   });
 
   var max_state = totalDonationsByState.top(1)[0].value;
 
   //Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["date_posted"];
   var maxDate = dateDim.top(1)[0]["date_posted"];
 
   //Charts
   timeChart = dc.barChart("#time-chart");
   resourceTypeChart = dc.rowChart("#resource-type-row-chart");
   povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
   numberProjectsND = dc.numberDisplay("#number-projects-nd");
   totalDonationsND = dc.numberDisplay("#total-donations-nd");
   fundingStatusChart = dc.pieChart("#funding-chart");
   primaryFocusAreaChart = dc.rowChart("#primary-focus-area-row-chart");
   gradeLevelChart = dc.pieChart("#grade-level-row-chart");
    stateChoropleth = dc.geoChoroplethChart("#county-choropleth");
 
 
   selectField = dc.selectMenu('#menu-select')
       .dimension(stateDim)
       .group(stateGroup)
   ;
 
    numberProjectsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(all)
        .formatNumber(d3.format(','))
    ;
 
   totalDonationsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(totalDonations)
       .formatNumber(d3.format(".3s"))
   ;
 
 timeChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(numProjectsByDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .xAxisLabel("Year")
       .yAxis().ticks(4)
 ;
 
   resourceTypeChart
       .width(300)
       .height(250)
       .dimension(resourceTypeDim)
       .group(numProjectsByResourceType)
       .xAxis().ticks(4)
   ;

   primaryFocusAreaChart
       .width(300)
       .height(250)
       .dimension(primaryFocusAreaDim)
       .group(numProjectsByPrimaryFocusArea)
       .xAxis().ticks(4)
   ;

   gradeLevelChart
       .height(220)
       .radius(90)
       .transitionDuration(1500)
       .dimension(gradeLevelDim)
       .externalLabels(20)
       .label(function (d) {
           var label = d.key.split(" ")[1]; // remove repetitive 'grades' from labels
           if (gradeLevelChart.hasFilter() && !gradeLevelChart.hasFilter(d.key)) {
                return label + ' (0%)';
           }
           if (all.value()) {
               label += ' (' + Math.floor(d.value / all.value() * 100) + '%)';
           }
           return label;
       })
       .group(numProjectsByGradeLevel)
       .legend(dc.legend().x(20).y(10).itemHeight(13).gap(5))
   ;
 
   povertyLevelChart
       .width(300)
       .height(250)
       .dimension(povertyLevelDim)
       .group(numProjectsByPovertyLevel)
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
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(fundingStatus)
       .group(numProjectsByFundingStatus)
   ;

    stateChoropleth
        .width(960)
        .height(540)
        .dimension(stateDim)
        .group(stateGroup)
        .overlayGeoJson(mapJson.features, "school_state", function (d) {
            return d.properties.ABBREVIATION;
        })
        //.colors(colorbrewer.YlOrRd[9])
        //.colorDomain([0, maxRisks])
        .title(function (d) {
            return stateFullname[stateAbbreviation.indexOf(d.key)] + " (" + d.key + ")" + "\nDonations: "
                    + (d.value ? d.value : 0);
        })
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
    ;

 
   dc.renderAll();
}

function findState(state) {
    return states.name ;
}