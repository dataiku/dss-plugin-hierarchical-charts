let allRows;
let webAppConfig = dataiku.getWebAppConfig()['webAppConfig'];

function draw() {

    console.warn('DRAWING ', allRows);

    /*
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'unit');
    data.addColumn('string', 'parent');
    data.addColumn('number', 'size');
    data.addColumn('number', 'color');

    for (var i = 0; i < allRows.length; i++) {
        arr = allRows[i];
        data.addRow([arr[0], arr[1], parseFloat(arr[2]), parseFloat(arr[3])]);
    }*/

    let data = new google.visualization.arrayToDataTable(allRows)
    function showFullTooltip(row, size, value) {
        if (data.getNumberOfColumns() == 4){
            return '<div style="background:#fd9; padding:10px; border-style:solid">' +
                   '<span style="font-family:Courier"><b>' + data.getValue(row, 0) +
                   '</b>, ' + data.getValue(row, 1) + '</span><br>' +
               data.getColumnLabel(2) +
                   ' (total size value of this cell and its children): ' + size + '<br>' +
               data.getColumnLabel(3) + ' (color value): ' + data.getValue(row, 2) + ' </div>';
        }
        else{
            return '<div style="background:#fd9; padding:10px; border-style:solid">' +
                   '<span style="font-family:Courier"><b>' + data.getValue(row, 0) +
                   '</b>, ' + data.getValue(row, 1) + '</span><br>' +
               data.getColumnLabel(2) + ' (total value of this cell and its children): ' + size + '<br>' +
                ' </div>';
        }
      }
    let  options = {
        highlightOnMouseOver: true,
        maxDepth: 1,
        maxPostDepth: 2,
        minHighlightColor: '#8c6bb1',
        midHighlightColor: '#9ebcda',
        maxHighlightColor: '#edf8fb',
        minColor: '#009688',
        midColor: '#f7f7f7',
        maxColor: '#ee8100',
        headerHeight: 15,
        showScale: true,
        showTooltips: true,
        height: 500,
        useWeightedAverageForAggregation: true,
        generateTooltip: showFullTooltip
      };
    let chart = new google.visualization.TreeMap(document.getElementById('treemap-chart'));
    chart.draw(data, options);
}

initTreemap( webAppConfig, (data) => {
    allRows = data;
    draw();
});

window.addEventListener('message', function(event) {
    if (event.data) {
        webAppConfig = JSON.parse(event.data)['webAppConfig'];
        if (!allRows) {
            return;
        }
        initTreemap(webAppConfig, (data) => {
            allRows = data;
            draw();
        });;
    }
});
