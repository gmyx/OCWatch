var duckdb = require('duckdb');
var fs = require('fs');
var unzipper = require('unzipper');

const { Readable } = require('stream');
const { finished } = require('stream/promises');

// URL to download the zip file from
const ocTranspoPath = 'https://oct-gtfs-emasagcnfmcgeham.z01.azurefd.net/public-access/GTFSExport.zip'

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

async function downloadStatic(runName) {
    const stream = fs.createWriteStream(`data\\GTFSExport_${runName}.zip`);    

    const { body } = await fetch(ocTranspoPath);
    
    await finished(Readable.fromWeb(body).pipe(stream));    
}

async function extractStatic(runName) {
    const directory = await unzipper.Open.file(`data\\GTFSExport_${runName}.zip`);
    await directory.extract({ path: `data\\GTFSExport_${runName}` })
}

function createRoutes(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS routes;
            CREATE TABLE routes (
                route_id STRING PRIMARY KEY,
                agency_id INT,
                route_short_name STRING,
                route_long_name STRING, 
                route_desc STRING,
                route_type INT,
                route_url STRING,
                route_color STRING,
                route_text_color STRING,
                route_sort_order INT,
                continuous_pickup INT,
                continuous_drop_off INT,
                network_id STRING
            ); COPY routes from 'data\\GTFSExport_${runName}\\routes.txt';`,
            (err, res) => {
                if (err) {
                    console.warn(err);                  
                }
                console.log(`   -> Created Routes table with ${res[0].Count} rows`);
                resolve();
            }
        );        
    });
}

function createShapes(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS shapes;
            CREATE TABLE shapes (
                shape_id STRING,
                shape_pt_lat FLOAT,
                shape_pt_lon FLOAT,
                shape_pt_sequence INT,
                shape_dist_traveled FLOAT
            ); COPY shapes from 'data\\GTFSExport_${runName}\\shapes.txt'`,
            (err, res) => {
                if (err) {                                        
                    console.warn(err);
                }
                console.log(`   -> Created Shapes table with ${res[0].Count} rows`);
                resolve();
            }
        );
    });
}

function createCalendar(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS calendar;
            CREATE TABLE calendar (
                service_id STRING,
                monday BOOL,
                tuesday BOOL,
                wednesday BOOL,
                thursday BOOL,
                friday BOOL,
                saturday BOOL,
                sunday BOOL,
                start_date STRING,
                end_data STRING
            ); COPY calendar from 'data\\GTFSExport_${runName}\\calendar.txt'`,
            (err, res) => {
                if (err) {
                    console.warn(err);
                }
                console.log(`   -> Created Calendar table with ${res[0].Count} rows`);
                resolve();
            }
        );
    });
}

function createTrips(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS trips;
            CREATE TABLE trips (
                route_id STRING,
                service_id STRING,
                trip_id STRING PRIMARY KEY,
                trip_headsign STRING,
                trip_short_name STRING,
                direction_id INT,
                block_id STRING,
                shape_id STRING,
                wheelchair_accessible BOOL,
                bikes_allowed BOOL
            ); COPY trips from 'data\\GTFSExport_${runName}\\trips.txt'`,
            function(err, res) {
                if (err) {
                    console.warn(err);
                }
                console.log(`   -> Created Trips table with ${res[0].Count} rows`);
                resolve();
            }
        );
    });
}

function createStops(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS stops;
            CREATE TABLE stops (
                stop_id STRING PRIMARY KEY,
                stop_code STRING,
                stop_name STRING,
                tts_stop_name STRING,
                stop_desc STRING,
                stop_lat FLOAT,
                stop_lon FLOAT,
                zone_id INT,
                stop_url STRING,
                location_type INT,
                parent_station INT,
                stop_timezone INT,
                wheelchair_boarding BOOL,
                level_id INT,
                platform_code STRING
            ); COPY stops from 'data\\GTFSExport_${runName}\\stops.txt'`,
            (err, res) => {
                if (err) {
                    console.warn(err);
                }
                console.log(`   -> Created Stops table with ${res[0].Count} rows`);
                resolve();
            }            
        );
    });
}

function createStope_times(db, runName) {
    return new Promise(resolve => {
        db.all (`
            DROP TABLE IF EXISTS stop_times;
            CREATE TABLE stop_times (
                trip_id STRING,
                arrival_time STRING,
                departure_time STRING,
                stop_id STRING,
                stop_sequence INT,
                stop_headsign STRING,
                pickup_type INT,
                drop_off_type INT,
                shape_dist_traveled FLOAT,
                timepoint BOOL
            ); COPY stop_times from 'data\\GTFSExport_${runName}\\stop_times.txt'`,
            (err, res) => {
                if (err) {
                    console.warn(err);
                }
                console.log(`   -> Created Stop_times table with ${res[0].Count} rows`);   
                resolve();             
            }
        );
    });
}

async function createTables(db, runName) {
    //start with routes
    await createRoutes(db, runName);
    await createShapes(db, runName);
    await createCalendar(db, runName);
    await createTrips(db, runName);
    await createStops(db, runName);
    await createStope_times(db, runName);
}

//run the code
(async() => {
var runName = getRunname();
console.log ('OCTranspo Static Data Converter');
console.log (`Run for ${runName}`);

console.log ('');
console.log ('Creating Data Folder...');
fs.existsSync('data') || fs.mkdirSync('data');

console.log ('Createing DB File...');
var db = new duckdb.Database('data\\' + getDBName());

console.log (`Downloading GTFS Export from ${ocTranspoPath}`);
fs.existsSync(`data\\GTFSExport_${runName}.zip`) || await downloadStatic(runName);

console.log ('Unzipping data');
await extractStatic(runName);

console.log ('Loading data into tables');
await createTables(db, runName);

//shutdown
await db.close();

console.log ('');
console.log ('Done.');
})();