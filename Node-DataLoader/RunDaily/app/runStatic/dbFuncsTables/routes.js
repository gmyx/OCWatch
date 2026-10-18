import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS routes (
                route_id VARCHAR(20),
                agency_id INT,
                route_short_name VARCHAR(12),
                route_long_name VARCHAR(128), 
                route_desc VARCHAR(255),
                route_type INT,
                route_url VARCHAR(255),
                route_color VARCHAR(6),
                route_text_color VARCHAR(6),
                route_sort_order INT,
                continuous_pickup INT,
                continuous_drop_off INT,
                network_id VARCHAR(20),
                runname VARCHAR(20),
                PRIMARY KEY (route_id, runname)
            );`
        );
    } catch (err) {
        console.error('Create routes failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {
    const filePath = `./localdata/GTFSExport_${runName}/routes.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM routes WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping routes due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing routes from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE routes_staging (
                route_id VARCHAR(20) PRIMARY KEY,
                agency_id INT,
                route_short_name VARCHAR(12),
                route_long_name VARCHAR(128), 
                route_desc VARCHAR(255),
                route_type INT,
                route_url VARCHAR(255),
                route_color VARCHAR(6),
                route_text_color VARCHAR(6),
                route_sort_order INT,
                continuous_pickup INT,
                continuous_drop_off INT,
                network_id VARCHAR(20)
            )  ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY routes_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO routes (
                route_id,
                agency_id,
                route_short_name,
                route_long_name,
                route_desc,
                route_type,
                route_url,
                route_color,
                route_text_color,
                route_sort_order,
                continuous_pickup,
                continuous_drop_off,
                network_id,
                runname                    
            )
            SELECT
                route_id,
                agency_id,
                route_short_name,
                route_long_name,
                route_desc,
                route_type,
                route_url,
                route_color,
                route_text_color,
                route_sort_order,
                continuous_pickup,
                continuous_drop_off,
                network_id,
                $1
            FROM routes_staging;
        `, [runName]);
        
        await client.query('COMMIT');
        console.log(`Imported routes for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}