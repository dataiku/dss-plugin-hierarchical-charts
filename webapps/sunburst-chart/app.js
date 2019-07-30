// Dimensions of sunburst.
let width = 350;
let height = 350;
let radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
let b = {
    w: 400, h: 30, s: 3, t: 10
};

// make `colors` an ordinal scale
let colors = d3.scale.category20();

// Total size of all segments; we set this later, after loading the data.
let totalSize = 0;

let vis = d3.select("#chart")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


let partition = d3.layout.partition()
    .size([2 * Math.PI, 100])
    .value(function(d) { return d.size; });

let arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return radius * Math.sqrt(d.y) / 10; })
    .outerRadius(function(d) { return radius * Math.sqrt(d.y + d.dy) / 10; });


// Main function to draw and set up the visualization, once we have the data.
function draw(first=true) {

    // Basic setup of page elements.
    if (first == true) {
          initializeBreadcrumbTrail();
    }  
    
    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // For efficiency, filter nodes to keep only those large enough to see.
    let nodes = partition.nodes(allRows)
        .filter(function(d) {
            return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
        });
    
    let path = vis.data([allRows]).selectAll("path")
        .data(nodes)
       .enter()
        .append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) { return colors(d.name); })
        .style("opacity", 1)
        .on("mouseover", mouseover);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.value;
};

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  let percentage = (100 * d.value / totalSize).toPrecision(3);
  let percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.select("#percentage")
      .text(percentageString);
  d3.select("#explanation")
      .style("visibility", "");

  let sequenceArray = getAncestors(d);
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
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .transition()
      .duration(1000)
      .style("visibility", "hidden");
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  let trail = d3.select("#leftsidebar").append("svg:svg")
      .attr("width", 600)
      .attr("height", height)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
    
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  let points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
   // debugger;
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  let g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });

  // Add breadcrumb and label for entering nodes.
  let entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors(d.name); });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("font-size", function(d){ // scale the font size according to text length
        let newLength = d.name.length;
        let charsPerLine = 50;
        if (newLength < charsPerLine){
            return "15px";
        }
        else {
            let newEmSize = charsPerLine / newLength;
            let textBaseSize = 15;    
            let newFontSize = (2 - newEmSize)*newEmSize * textBaseSize;
            return newFontSize + "px";
        }
    });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    return "translate(0, " + i * (b.h + b.s) + ")";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", b.w / 2)
      .attr("y", (nodeArray.length + 0.5) * (b.h + b.s))
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}


let allRows;
let webAppConfig = dataiku.getWebAppConfig()['webAppConfig'];
let dataset_name = webAppConfig['dataset'];
let unit_column = webAppConfig['unit'];
let parent_column = webAppConfig['parent'];
let size_column = webAppConfig['value'];

$.getJSON(getWebAppBackendUrl('reformat_data'), {'dataset_name': dataset_name, 'unit_column': unit_column, 'parent_column': parent_column, 'size_column': size_column})
    .done(
        function(data){
            allRows = data['children'];
            draw()
        }
    ).error(function(data){
                webappMessages.displayFatalError('Internal Server Error: ' + data.responseText); 
            }
        );

var counter;
counter = 1;
window.addEventListener('message', function(event) {
    // counter is a quick fix for the duplicate event message problem
    if (event.data && counter%2==1) {
        location.reload() // reload the html to clean the error message if exist
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
            ).error(function(data){
                webappMessages.displayFatalError('Internal Server Error: ' + data.responseText); 
                }
            );
    };
    counter = counter + 1; 
});