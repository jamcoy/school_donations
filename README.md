#School Donations Dashboard

Code Institute stream 2 project.

View here:
[http://stream2.jamcoy.com](https://stream2.jamcoy.com) (this will redirect you to a Heroku app).

##About
A dataset has been taken from DonorsChoose.org; a US-based public charity providing a platform for fundraising for schools.  The data is presented to the user in the form of an interactive dashboard containing a variety of charts.

##Technologies
**[Flask](http://flask.pocoo.org/)** - Micro-framework for Python applications.  
**[MongoDB](https://www.mongodb.com/)** - Document-oriented (NoSQL) database using JSON-like documents.  
**[dc.js](https://github.com/dc-js/dc.js/wiki)** - Multi-dimensional charting library built to work natively with crossfilter and using d3.js for rendering.  
**[d3.js](https://d3js.org/)** - JavaScript library for manipulating documents based on data.  
**[d3-queue](https://github.com/d3/d3-queue)** - Lightweight asynchronous helper library used to load the donation data from the database and the GeoJSON data from a local file.  
**[Crossfilter](https://square.github.io/crossfilter/)** - JavaScript library for exploring large multivariate datasets in the browser.  Crossfilter enables easy manipulation of the data so that applied filters can be readily shown across all charts.  
**[Bootstrap](http://getbootstrap.com/)** provides a responsive framework to the application.  This was enhanced with media queries and additional code to resize some of the dc.js charts, which are not natively responsive.  
**[Dashboards by keen IO](https://keen.github.io/dashboards/)** - Responsive dashboard templates for Bootstrap.  
**[Intro.js](http://introjs.com/)** - Used to provide a step-by step guide to the application.

##dc.js Charts
Several chart types were selected to visualise the data.  Most charts are interactive; the user can click on various elements to filter the data.  Filters can be cleared by dimension by clicking on a chart's reset button, or all filters can be cleared by clicking on the **Reset All** button in the navigation menu.  The applied US state filter is always shown in the 'always-on-top' navigation menu.
###Number displays
Number displays are used to display headline figures for money raised, number of projects and schools reached.
###Choropleth
A choropleth is a geographical map divided into regions, with each region coloured to show its relative value against other regions.  The choropleth is interactive on wider screens:  The user can select one or more US states to filter the data.  The user can also hover the mouse over a US state to obtain it's donation value.  This would be difficult on small screens, so interactivity is disabled when a small viewport is identified and the 'select menu' (see below) is provided to the user as an alternative means of input.  A [GeoJSON boundary file](http://eric.clst.org/Stuff/USGeoJSON) for the US states was obtained (source: The Census Bureau) and edited using [QGIS](http://qgis.org/en/site/) to extract Washington D.C., which would otherwise be too small to select.  The GeoJSON file was then simplified using [mapshaper](https://github.com/mbloch/mapshaper).
###Area chart
The area chart (a line chart with the area under the line rendered) shows the number of monthly donations.  It is shown in the same Keen Dashboard chart-wrapper as the bar chart because they share the same date dimension.  
###Bar chart
The bar chart shows the number of projects per month.  The user can select a date region on the chart to apply a filter to the entire dataset.  The x-axis is aligned with the x-axis of the area chart.
###Row charts
Row charts were selected to show how projects were distributed between different types of resources and different primary focus areas.  One or more rows can be selected to apply or remove filters.
###Donut(pie) charts
Donut charts (dc.js pie charts with an inner radius) were select to show how projects were distributed between different poverty groups and different grade levels.  One or more slices can be selected to apply or remove filters.
###Select menu
In order to retain full functionality on small devices, a dc.js select menu enables selection of a US state using a drop-down menu.  This is hidden on larger displays.

##Hosting
The application is deployed on the [Heroku](https://.heroku.com) PAAS (platform as a service) using a free dyno and a MongoDB 'add-on'.  Config vars are utilised in the Flask framework to automatically switch the application between local development and production modes.