var fs = require('fs');


//take results from getStatic and put it in evidence project
function join(date, options, separator) {
    function format(option) {
       let formatter = new Intl.DateTimeFormat('en', option);
       return formatter.format(date);
    }
    return options.map(format).join(separator);
}


function getRunname() {
    let options = [{year: 'numeric'}, {month: 'short'}, {day: 'numeric'}];
    let joined = join(new Date, options, '-');
    
    return joined;   
}

function getDBName() {
   
    return getRunname() + '.db';
}

//run the code
(async() => {
    var runName = getRunname();
    console.log (`OCTranspo Static Data Daily Run for ${runName}`);

    //copy the data for today into the evidece project
    fs.copyFileSync ('data\\' + getDBName(), 'Evidence\\sources\\GTFS\\GTFS.db') ;

    //update sources
    require('child_process').execSync(
        'npm run sources --prefix "Evidence"',
        {stdio: 'inherit'}
    );
})();