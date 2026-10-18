import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS stops (
                stop_id VARCHAR(20),
                stop_code VARCHAR(20),
                stop_name VARCHAR(255),
                tts_stop_name VARCHAR(255),
                stop_desc VARCHAR(255),
                stop_lat FLOAT,
                stop_lon FLOAT,
                zone_id INT,
                stop_url VARCHAR(255),
                location_type INT,
                parent_station VARCHAR(20),
                stop_timezone INT,
                wheelchair_boarding BOOL,
                level_id INT,
                platform_code VARCHAR(20),
                runname VARCHAR(20),
                PRIMARY KEY (stop_id, runname)
            );`
        );
    } catch (err) {
        console.error('Create stops failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/stops.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM stops WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping stops due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing stops from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE stops_staging (
                stop_id VARCHAR(20),
                stop_code VARCHAR(20),
                stop_name VARCHAR(255),
                tts_stop_name VARCHAR(255),
                stop_desc VARCHAR(255),
                stop_lat FLOAT,
                stop_lon FLOAT,
                zone_id INT,
                stop_url VARCHAR(255),
                location_type INT,
                parent_station VARCHAR(20),
                stop_timezone INT,
                wheelchair_boarding BOOL,
                level_id INT,
                platform_code VARCHAR(20)
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY stops_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO stops (
                stop_id,
                stop_code,
                stop_name,
                tts_stop_name,
                stop_desc,
                stop_lat, 
                stop_lon, 
                zone_id, 
                stop_url,
                location_type ,
                parent_station,
                stop_timezone, 
                wheelchair_boarding, 
                level_id, 
                platform_code,
                runname                    
            )
            SELECT
                stop_id,
                stop_code,
                stop_name,
                tts_stop_name,
                stop_desc,
                stop_lat, 
                stop_lon, 
                zone_id, 
                stop_url,
                location_type ,
                parent_station,
                stop_timezone, 
                wheelchair_boarding, 
                level_id, 
                platform_code,
                $1
            FROM stops_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported stops for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}