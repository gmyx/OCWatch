import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS calendar_dates (
                service_id VARCHAR(40),
                date DATE,
                exeption_type INT,
                runname VARCHAR(20),
                PRIMARY KEY (service_id, date, runname)
            );`
        ); //yes, date is part PK because OC repeats themselves
    } catch (err) {
        console.error('Create calendar_dates failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/calendar_dates.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM calendar_dates WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping calendar_dates due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing calendar_dates from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE calendar_dates_staging (
                service_id VARCHAR(40),
                date DATE,
                exeption_type INT
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY calendar_dates_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO calendar_dates (
                service_id,
                date,
                exeption_type,
                runname                  
            )
            SELECT
                service_id,
                date,
                exeption_type,
                $1
            FROM calendar_dates_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported Calendar_dates for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}