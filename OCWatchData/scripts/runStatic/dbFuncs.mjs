import { tempPath } from './config.mjs';

async function createRoutes(db, runName) {    
    await db.run('DROP TABLE IF EXISTS routes;');
    await db.run(`CREATE TABLE routes (                    
                    route_id STRING PRIMARY KEY,
                    agency_id STRING,
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
    const result = await db.runAndReadAll(`COPY routes from \'${tempPath}\\GTFSExport_${runName}\\routes.txt\'`);
    console.log(`   -> Created Routes table with ${result.getRowObjects()[0].Count} rows`);
}
 
async function createShapes(db, runName) {
    await db.run('DROP TABLE IF EXISTS shapes;');
    await db.run(`CREATE TABLE shapes (
                    shape_id STRING,
                    shape_pt_lat FLOAT,
                    shape_pt_lon FLOAT,
                    shape_pt_sequence INT,
                    shape_dist_traveled FLOAT                
                );`);
    const result = await db.runAndReadAll(`COPY shapes from \'${tempPath}\\GTFSExport_${runName}\\shapes.txt\'`);
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
    const result = await db.runAndReadAll(`COPY calendar from '${tempPath}\\GTFSExport_${runName}\\calendar.txt'`)
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
    const result = await db.runAndReadAll(`COPY trips from '${tempPath}\\GTFSExport_${runName}\\trips.txt'`)
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
                    zone_id STRING,
                    stop_url STRING,
                    location_type INT,
                    parent_station STRING,
                    stop_timezone INT,
                    wheelchair_boarding INT,
                    level_id STRING,
                    platform_code STRING
             );`)
    const result = await db.runAndReadAll(`COPY stops from '${tempPath}\\GTFSExport_${runName}\\stops.txt'`)
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
        const result = await db.runAndReadAll(`COPY stop_times from '${tempPath}\\GTFSExport_${runName}\\stop_times.txt'`)
        console.log(`   -> Created Stop Times table with ${result.getRowObjects()[0].Count} rows`);  
}

async function pruneRoutes(db) {
    //nulls
    await db.run('ALTER TABLE routes DROP route_desc; ALTER TABLE routes DROP route_url; ALTER TABLE routes DROP network_id');    

    //pointless - the data is always the same since OC does not use them
    await db.run('ALTER TABLE routes DROP agency_id; ALTER TABLE routes DROP continuous_pickup; ALTER TABLE routes DROP continuous_drop_off')
    console.log('   -> Removed NULL and uselesss columns from routes')
}
async function pruneTrips(db) {
    //nulls
    await db.run('ALTER TABLE trips DROP trip_short_name');    

    //pointless - the data is always the same since OC does not use them. note at last check, one trip on the 86 was false. don't know why
    await db.run('ALTER TABLE trips DROP wheelchair_accessible; ALTER TABLE trips DROP bikes_allowed;')
    console.log('   -> Removed NULL and uselesss columns from trips')
}

async function pruneStops(db) {
    //nulls
    await db.run('ALTER TABLE stops DROP tts_stop_name; ALTER TABLE stops DROP stop_desc; ALTER TABLE stops DROP zone_id; ALTER TABLE stops DROP stop_url; ALTER TABLE stops DROP stop_timezone; ALTER TABLE stops DROP level_id ');    

    //pointless - the data is always the same since OC does not use them. 
    //wheelchair_boarding: it is either null or 0, which is basicly null - info not known
    await db.run('ALTER TABLE stops DROP wheelchair_boarding;')
    console.log('   -> Removed NULL and uselesss columns from stops')
}

async function pruneStop_times(db) {   

    //pointless - the data is always the same since OC does not use them. 
    //removing pickup_type and drop_off_types becuase it only is used on first and last stops (I think)
    await db.run('ALTER TABLE stop_times DROP pickup_type; ALTER TABLE stop_times DROP drop_off_type;')
    console.log('   -> Removed NULL and uselesss columns from stop_times')
}
  
  
//internal DB functions
async function createTables (db, runName) {
    //start with routes
    await createRoutes(db, runName);
    await createShapes(db, runName);
    await createCalendar(db, runName);
    await createTrips(db, runName);
    await createStops(db, runName);
    await createStope_times(db, runName);
}

async function pruneNullColumns (db) {
    //OC Transpo does not use all fields in the GTFS spec, so remove them from the final stuff
    //only some talbes need pruning, if not listed, it doesn't need it
    await pruneRoutes (db);
    await pruneTrips (db);
    await pruneStops (db);
    await pruneStop_times (db);
}

export { createTables, pruneNullColumns }
