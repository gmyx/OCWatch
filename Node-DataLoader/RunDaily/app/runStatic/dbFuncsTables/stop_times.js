import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS stop_times (
                trip_id VARCHAR(20),
                arrival_time VARCHAR(20),
                departure_time VARCHAR(20),
                stop_id VARCHAR(20),
                stop_sequence INT,
                stop_headsign VARCHAR(255),
                pickup_type INT,
                drop_off_type INT,
                shape_dist_traveled FLOAT,
                timepoint BOOL,       
                runname VARCHAR(20),
                PRIMARY KEY (trip_id, arrival_time, stop_id, runname)
            );` //yes, need arrival time. route 57 from OCTranspo goes to the same stop twice (5520 Lincond Fields 2A)!
                //note 2: GTFS time goes over 24. so a time of 27:45 is valid.
        );
    } catch (err) {
        console.error('Create stop_times failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/stop_times.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM stop_times WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping stop_times due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing stop_times from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE stop_times_staging (
                trip_id VARCHAR(20),
                arrival_time VARCHAR(20),
                departure_time VARCHAR(20),
                stop_id VARCHAR(20),
                stop_sequence INT,
                stop_headsign VARCHAR(255),
                pickup_type INT,
                drop_off_type INT,
                shape_dist_traveled FLOAT,
                timepoint BOOL 
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY stop_times_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO stop_times (
                trip_id,
                arrival_time,
                departure_time,
                stop_id,
                stop_sequence, 
                stop_headsign,
                pickup_type,
                drop_off_type,
                shape_dist_traveled,
                timepoint, 
                runname                    
            )
            SELECT
                trip_id,
                arrival_time,
                departure_time,
                stop_id,
                stop_sequence,
                stop_headsign,
                pickup_type,
                drop_off_type,
                shape_dist_traveled,
                timepoint ,
                $1
            FROM stop_times_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported stop_times for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}