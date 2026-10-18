import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS trips (
                route_id VARCHAR(20),
                service_id VARCHAR(40),
                trip_id VARCHAR(20),
                trip_headsign VARCHAR(255),
                trip_short_name VARCHAR(255),
                direction_id INT,
                block_id VARCHAR(20),
                shape_id VARCHAR(40),
                wheelchair_accessible BOOL,
                bikes_allowed BOOL,
                runname VARCHAR(20),
                PRIMARY KEY (trip_id, runname)
            );`
        );
    } catch (err) {
        console.error('Create trips failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/trips.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM trips WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping trips due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing trips from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE trips_staging (
                route_id VARCHAR(20),
                service_id VARCHAR(40),
                trip_id VARCHAR(20),
                trip_headsign VARCHAR(255),
                trip_short_name VARCHAR(255),
                direction_id INT,
                block_id VARCHAR(20),
                shape_id VARCHAR(40),
                wheelchair_accessible BOOL,
                bikes_allowed BOOL
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY trips_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO trips (
                route_id,
                service_id,
                trip_id,
                trip_headsign,
                trip_short_name,
                direction_id,
                block_id,
                shape_id,
                wheelchair_accessible,
                bikes_allowed,
                runname                    
            )
            SELECT
                route_id,
                service_id,
                trip_id,
                trip_headsign,
                trip_short_name,
                direction_id,
                block_id,
                shape_id,
                wheelchair_accessible,
                bikes_allowed,
                $1
            FROM trips_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported trips for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}