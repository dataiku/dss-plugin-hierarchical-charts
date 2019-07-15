let allRows;
let webAppConfig = dataiku.getWebAppConfig()['webAppConfig'];

function draw() {
    
    let data = new google.visualization.arrayToDataTable(allRows)
    console.warn('DATA: ',allRows)
    function showFullTooltip(row, size, value) {
        if (data.getNumberOfColumns() == 4){
            return '<div style="background:#fd9; padding:10px; border-style:solid">' +
                   '<span style="font-family:Courier"><b>' + data.getValue(row, 0) +
                   '</b>, ' + data.getValue(row, 1) + '</span><br>' +
               data.getColumnLabel(2) +
                   ' (total size value of this cell and its children): ' + size + '<br>' +
               data.getColumnLabel(3) + ' (color value): ' + data.getValue(row, 3) + ' </div>';
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
        //noColor: 'lime', 
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


try {
    dataiku.checkWebAppParameters();
} catch (e) {
    webappMessages.displayFatalError(e.message + ' Go to settings tab.');
    return;
}

let dataReady;
let chartReady;

let dataset_name = webAppConfig['dataset'];
let unit_column = webAppConfig['unit'];
let parent_column = webAppConfig['parent'];
let size_column = webAppConfig['size'];
let color_column = webAppConfig['color'];


if (!window.google) {
    webappMessages.displayFatalError('Failed to load Google Charts library. Check your connection.');
} else {
    google.charts.load('current', {'packages':['treemap']});
    google.charts.setOnLoadCallback(function() {
        $.getJSON(getWebAppBackendUrl('reformat_data'), {'dataset_name': dataset_name, 'unit_column': unit_column, 'parent_column': parent_column, 'size_column': size_column, 'color_column': color_column})
            .done(
                function(data){
                    allRows = data['result'];
                    draw();
                }
        );
    });
};

window.addEventListener('message', function(event) {
    if (event.data) {
        webAppConfig = JSON.parse(event.data)['webAppConfig'];
        
        let dataset_name = webAppConfig['dataset'];
        let unit_column = webAppConfig['unit'];
        let parent_column = webAppConfig['parent'];
        let size_column = webAppConfig['size'];
        let color_column = webAppConfig['color'];

        if (!window.google) {
            webappMessages.displayFatalError('Failed to load Google Charts library. Check your connection.');
        } else {
            google.charts.load('current', {'packages':['treemap']});
            google.charts.setOnLoadCallback(function() {
                $.getJSON(getWebAppBackendUrl('reformat_data'), {'dataset_name': dataset_name, 'unit_column': unit_column, 'parent_column': parent_column, 'size_column': size_column, 'color_column': color_column})
                    .done(
                        function(data){
                            allRows = data['result'];
                            draw();
                        }
                );
            });
        };
    }
});
