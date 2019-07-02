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
    const sequence = cfg['sequence'];
    const value = cfg['value'];
    //console.warn('----COLOR: ', color)
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
        onReady(allRows);
    }

    dataiku.fetch(dataset, sampling, function(dataFrame) {
        allRows = dataFrame.mapRecords(r => [r[sequence], parseFloat(r[value])]);
        dataReady = true;
        drawAppIfEverythingReady();
    })
}