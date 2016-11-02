queue()
   .defer(d3.json, "/donorsUS/projects")
   .await(makeGraphs);
 
function makeGraphs(error, projectsJson) {
 
   //Clean projectsJson data
   var donorsUSProjects = projectsJson;
   var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
   donorsUSProjects.forEach(function (d) {
       d["date_posted"] = dateFormat.parse(d["date_posted"]);
       d["date_posted"].setDate(1);
       d["total_donations"] = +d["total_donations"];
       d["grade_level"] = (d["grade_level"].split(" "))[1]; // remove repetitive 'grades' from labels
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
   var timeChart = dc.barChart("#time-chart");
   var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
   var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
   var numberProjectsND = dc.numberDisplay("#number-projects-nd");
   var totalDonationsND = dc.numberDisplay("#total-donations-nd");
   var fundingStatusChart = dc.pieChart("#funding-chart");
    var primaryFocusAreaChart = dc.rowChart("#primary-focus-area-row-chart")
    var gradeLevelChart = dc.pieChart("#grade-level-row-chart")
 
 
   selectField = dc.selectMenu('#menu-select')
       .dimension(stateDim)
       .group(stateGroup);
 
 
   numberProjectsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(all);
 
   totalDonationsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(totalDonations)
       .formatNumber(d3.format(".3s"));
 
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
       .yAxis().ticks(4);
 
   resourceTypeChart
       .width(300)
       .height(250)
       .dimension(resourceTypeDim)
       .group(numProjectsByResourceType)
       .xAxis().ticks(4);

   primaryFocusAreaChart
       .width(300)
       .height(250)
       .dimension(primaryFocusAreaDim)
       .group(numProjectsByPrimaryFocusArea)
       .xAxis().ticks(4);

   gradeLevelChart
       .height(220)
       .radius(90)
       .transitionDuration(1500)
       .dimension(gradeLevelDim)
       .group(numProjectsByGradeLevel);
 
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
       .xAxis().ticks(4);
 
   fundingStatusChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(fundingStatus)
       .group(numProjectsByFundingStatus);
 
 
   dc.renderAll();
}