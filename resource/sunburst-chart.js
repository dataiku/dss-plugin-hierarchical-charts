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
    const value = cfg['value'];
    const sampling = {};

    function drawAppIfEverythingReady() {
        onReady(allRows);
    }
    
    function create_dict(r){
        var dict = {
          'name': r[unit],
          'parent': r[parent],
          'size': parseFloat(r[value])
        };
        return dict
    }
    dataiku.fetch(dataset, sampling, function(dataFrame) {
        allRows = dataFrame.mapRecords(create_dict);
        dataReady = true;
        drawAppIfEverythingReady();
    })
}