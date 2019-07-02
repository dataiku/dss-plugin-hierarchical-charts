let dataReady;
let chartReady;



function initSunburst(cfg, onReady) {
    try {
        dataiku.checkWebAppParameters();
    } catch (e) {
        webappMessages.displayFatalError(e.message + ' Go to settings tab.');
        return;
    }

    console.warn('CFG ', cfg)
    const dataset = cfg['dataset'];
    const unit = cfg['unit'];
    const parent = cfg['parent'];
    const cell_size = cfg['cell_size'];
    const color = cfg['color'];
    console.warn('----COLOR: ', color)
    const sampling = {};

    let allRows;
    let old_record = null;

    function transform_record(record){
        var row = [];
        row.push(record[unit]);
        if (old_record == null){
            row.push("0");
            row.push("0");
        }
        else {
            row.push(old_record[value]);
            row.push(old_record[value]);
        }

        row.push(record[value]);
        row.push(record[value]);

        old_record = record;
        return row;
    }

    function drawAppIfEverythingReady() {
        if (!chartReady || !dataReady) {
            return;
        }
        onReady(allRows);
    }

    if (!window.google) {
        webappMessages.displayFatalError('Failed to load Google Charts library. Check your connection.');
    } else {
        google.charts.load('current', {'packages':['treemap']});
        google.charts.setOnLoadCallback(function() {
            chartReady = true;
            drawAppIfEverythingReady();
        });
        dataiku.fetch(dataset, sampling, function(dataFrame) {
            //allRows = dataFrame.mapRecords(transform_record);
            //var last_index = allRows.length - 1;
            //var final_row = ["final", "0", "0", allRows[last_index][4], allRows[last_index][4]];
            //allRows.push(final_row);

            if (typeof color == 'undefined'){
                console.warn('3 COLUMNS ONLY !!!')
                var columnNames = [[unit, parent, cell_size]];
                var rows = dataFrame.mapRecords(r => [r[unit], r[parent], parseFloat(r[cell_size])]);
            }
            else{
                console.warn('4 COLUMNS !!!')
                var columnNames = [[unit, parent, cell_size, color]];
                var rows = dataFrame.mapRecords(r => [r[unit], r[parent], parseFloat(r[cell_size]), parseFloat(r[color])]);
            }
            //console.warn('columnNames', typeof columnNames[0])
            //console.warn('rows', typeof rows[0])
            allRows = columnNames.concat(rows);
            dataReady = true;
            drawAppIfEverythingReady();
        });
    }
}