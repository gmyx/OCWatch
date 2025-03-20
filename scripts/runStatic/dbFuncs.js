async function createRoutes(db, runName) {
    await db.run('DROP TABLE IF EXISTS routes;');
    await db.run(`CREATE TABLE routes (
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
                );`);
    const result = await db.runAndReadAll(`COPY routes from \'data\\GTFSExport_${runName}\\routes.txt\'`);
    console.log(`   -> Created Routes table with ${result.getRowObjects()[0].Count} rows`);
}
 
async function createShapes(db, runName) {
    await db.run('DROP TABLE IF EXISTS shapes');
    await db.run(`CREATE TABLE shapes (
                    shape_id STRING,
                    shape_pt_lat FLOAT,
                    shape_pt_lon FLOAT,
                    shape_pt_sequence INT,
                    shape_dist_traveled FLOAT
                );`);
    const result = await db.runAndReadAll(`COPY shapes from \'data\\GTFSExport_${runName}\\shapes.txt\'`);
    console.log(`   -> Created Shapes table with ${result.getRowObjects()[0].Count} rows`);    
}
 
async function createCalendar(db, runName) {
    await db.run('DROP TABLE IF EXISTS calendar;');
    await db.run(`CREATE TABLE calendar (
                    service_id STRING,
                    monday BOOL,
                    tuesday BOOL,
                    wednesday BOOL,
                    thursday BOOL,
                    friday BOOL,
                    saturday BOOL,
                    sunday BOOL,
                    start_date STRING,
                    end_date STRING
                );`);
    const result = await db.runAndReadAll(`COPY calendar from 'data\\GTFSExport_${runName}\\calendar.txt'`)
    console.log(`   -> Created Calendar table with ${result.getRowObjects()[0].Count} rows`);
}
 
async function createTrips(db, runName) {
    await db.run('DROP TABLE IF EXISTS trips;');
    await db.run(`CREATE TABLE trips (
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
                );`);
    const result = await db.runAndReadAll(`COPY trips from 'data\\GTFSExport_${runName}\\trips.txt'`)
    console.log(`   -> Created Trips table with ${result.getRowObjects()[0].Count} rows`);        
}
 
async function createStops(db, runName) {
    await db.run('DROP TABLE IF EXISTS stops;');
    await db.run(`CREATE TABLE stops (
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
             );`)
    const result = await db.runAndReadAll(`COPY stops from 'data\\GTFSExport_${runName}\\stops.txt'`)
    console.log(`   -> Created Stops table with ${result.getRowObjects()[0].Count} rows`);        
 }

async function createStope_times(db, runName) {
    await db.run('DROP TABLE IF EXISTS stop_times;');
    await db.run(`CREATE TABLE stop_times (
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
            );`)    ;
        const result = await db.runAndReadAll(`COPY stop_times from 'data\\GTFSExport_${runName}\\stop_times.txt'`)
        console.log(`   -> Created Stop Times table with ${result.getRowObjects()[0].Count} rows`);  
}
  
//internal DB functions
module.exports = {
    createTables: async function (db, runName) {
        //start with routes
        await createRoutes(db, runName);
        await createShapes(db, runName);
        await createCalendar(db, runName);
        await createTrips(db, runName);
        await createStops(db, runName);
        await createStope_times(db, runName);
    }
}