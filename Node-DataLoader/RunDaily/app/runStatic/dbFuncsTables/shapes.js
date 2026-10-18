import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS shapes (
                shape_id VARCHAR(20),
                shape_pt_lat FLOAT,
                shape_pt_lon FLOAT,
                shape_pt_sequence INT,
                shape_dist_traveled FLOAT,        
                runname VARCHAR(20),
                PRIMARY KEY (shape_id, shape_pt_sequence, runname)
            );`
        );
    } catch (err) {
        console.error('Create shapes failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/shapes.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM shapes WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping shapes due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing shapes from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE shapes_staging (
                shape_id TEXT,
                shape_pt_lat TEXT,
                shape_pt_lon TEXT,
                shape_pt_sequence TEXT,
                shape_dist_traveled TEXT
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY shapes_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO shapes (
                shape_id,
                shape_pt_lat,
                shape_pt_lon,
                shape_pt_sequence,
                shape_dist_traveled,
                runname                    
            )
            SELECT
                shape_id,
                shape_pt_lat::double precision,
                shape_pt_lon::double precision,
                shape_pt_sequence::integer,
                NULLIF(shape_dist_traveled, '')::double precision,
                $1
            FROM shapes_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported shapes for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}