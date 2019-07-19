// Dimensions of sunburst.
var width = 500;
var sequence_width = 1000;
var height = 500;
var radius = Math.min(width, height) / 2;


var stringToColour = d3.scaleOrdinal(d3.schemeCategory20c);


/*
// similar strings generate similar color -> be aware
var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    console.warn(colour);
    return colour;
}*/

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 150, h: 30, s: 3, t: 10
};


// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

// Main function to draw and set up the visualization, once we have the data.
function draw(first=true) {

  // Basic setup of page elements.
  if (first == true) {
      initializeBreadcrumbTrail();
  }
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

  // Turn the data into a d3 hierarchy and calculate the sums.
  var root = d3.hierarchy(allRows)
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.value - a.value; });

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition(root).descendants()
      .filter(function(d) {
          return (d.x1 - d.x0 > 0.000); // 0.005 radians = 0.29 degrees
      });
  //console.warn('VIS in DRAW: ', nodes);
  //console.warn('BEFORE: ', nodes)

  // path is empty when reloading, wtf ?
  var path = vis.selectAll("path") //.data([allRows])
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return stringToColour(d.data.name); })
      .style("opacity", 1)
      .on("mouseover", null)
      .on("mouseover", mouseover);// wtf why this does not work when reload

  
    
  //console.warn('AFTER: ', root)

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = root.value//100; //path.datum().value;
 };

//Stash the old values for transition.
function stash(d) {
    d.x0 = d.x;
    d.dx0 = d.dx;
    }

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  //console.warn('MOUSE OVER')

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
  //d3.select("#percentage")
  //    .text(percentageString);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  updateBreadcrumbs(sequenceArray, percentageString);
  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(100)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", null).on("mouseover", mouseover);
            })
    ;

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#leftsidebar").append("svg:svg")
      .attr("width", sequence_width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.data.name + d.depth; });


  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return stringToColour(d.data.name); });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.data.name; });

  // Set position for entering and updating nodes.
  trail.attr("transform", function(d, i) {
    return "translate(0, " + i * (b.h + b.s) + ")";
  });
    
  // Remove exiting nodes.
  trail.exit().remove();
  
  /*
  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });*/

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", b.w/2)
      .attr("y", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

var colors = {
  "Global": "#5687d1",
  "America": "#7b615c",
  "Asia": "#de783b",
  "Africa": "#6ab975",
  "USA": "#a173d1",
  "Australia": "#bbbbbb"
};

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 75, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

let allRows;
let dataReady;
let chartReady;
let webAppConfig = dataiku.getWebAppConfig()['webAppConfig'];
let dataset_name = webAppConfig['dataset'];
let unit_column = webAppConfig['unit'];
let parent_column = webAppConfig['parent'];
let size_column = webAppConfig['value'];

$.getJSON(getWebAppBackendUrl('reformat_data'), {'dataset_name': dataset_name, 'unit_column': unit_column, 'parent_column': parent_column, 'size_column': size_column})
    .done(
        function(data){
            console.warn('REFORMAT DATA ', data); 
            allRows = data['children'];
            draw()
        }
    );


var counter;
counter = 1;
window.addEventListener('message', function(event) {
    if (event.data && counter%2==1) {
        webAppConfig = JSON.parse(event.data)['webAppConfig'];
        vis.selectAll("*").remove();

        let dataset_name = webAppConfig['dataset'];
        let unit_column = webAppConfig['unit'];
        let parent_column = webAppConfig['parent'];
        let size_column = webAppConfig['value'];
        $.getJSON(getWebAppBackendUrl('reformat_data'), {'dataset_name': dataset_name, 'unit_column': unit_column, 'parent_column': parent_column, 'size_column': size_column})
            .done(
                function(data){
                    allRows = data['children'];
                    draw(first=false); 
                }
            );
    };
    counter = counter + 1; 
});