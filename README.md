# Hierarchical charts

This plugins provides two classic hierarchical visualizations: treemap and sunburst.

These charts take as input [`Unit column` (child node) , `Parent column` (the corresponding parent node) , `Value column`]. In the case of the treemap chart, an optional `Color column` can be provided.

## Usage
These new visualizations are provided as custom charts and are available in the "Other" tab of the chart type selector.

### Treemap
This chart is based on the [Google Charts library](https://developers.google.com/chart/) and requires internet access.

When no color column is provided, the size is also used for color information.

Click to zoom in a child, right-click to zoom out.

### Sunburst
No negative values can be present in the value column.

## License
This project is licensed under the Apache Software License.
