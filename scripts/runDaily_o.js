var fs = require('fs');
const common = require('./common');

//run the code
(async() => {
    var runName = common.static.getRunname();
    console.log (`OCTranspo Static Data Daily Run for ${runName}`);

    //copy the data for today into the evidece project
    fs.copyFileSync ('data\\' + common.static.getDBName(), 'Evidence\\sources\\GTFS\\GTFS.db') ;
    fs.copyFileSync ('data\\' + common.realtime.getDBName(), 'Evidence\\sources\\OCRealtime\\OCRealtime.db') ;

    //update sources
    require('child_process').execSync(
        'npm run sources --prefix "Evidence"',
        {stdio: 'inherit'}
    );
})();