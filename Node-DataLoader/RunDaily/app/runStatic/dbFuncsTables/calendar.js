import fs from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'pg';
const { Pool } = pkg;
import { from as copyFrom } from 'pg-copy-streams';

export async function create(sql) {
    const client = await sql.connect();
    try {
        await await client.query(`
            CREATE TABLE IF NOT EXISTS calendar (
                service_id VARCHAR(40),
                monday BOOL,
                tuesday BOOL,
                wednesday BOOL,
                thursday BOOL,
                friday BOOL,
                saturday BOOL,
                sunday BOOL,
                start_date DATE,
                end_date DATE,        
                runname VARCHAR(20),
                PRIMARY KEY (service_id, runname)
            );`
        );
    } catch (err) {
        console.error('Create calendar failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}

export async function importData(sql, runName) {    
    const filePath = `./localdata/GTFSExport_${runName}/calendar.txt`;

    const client = await sql.connect();
    try {
        // Check if already imported
        const existingRun = await client.query(
            'SELECT 1 FROM calendar WHERE runname = $1 LIMIT 1;', 
            [runName]
        );

        if (existingRun.rows.length > 0) {
            console.log(`Skipping calendar due to "${runName}" having already been imported.`);
            return;
        }
        console.log(`Importing calendar from "${runName}".`);

        // Begin transaction
        await client.query('BEGIN');

        // Create all-text staging table
        await client.query(`
            CREATE TEMP TABLE calendar_staging (
                service_id VARCHAR(40),
                monday BOOL,
                tuesday BOOL,
                wednesday BOOL,
                thursday BOOL,
                friday BOOL,
                saturday BOOL,
                sunday BOOL,
                start_date DATE,
                end_date DATE
            ) ON COMMIT DROP;`
        );

        // Setup stream pipeline using pg-copy-streams
        const fileStream = fs.createReadStream(filePath);
        const copyStream = client.query(copyFrom(`
            COPY calendar_staging 
            FROM STDIN 
            WITH (FORMAT CSV, HEADER true, DELIMITER ',')
        `));

        // Stream data safely with built-in backpressure handling
        await pipeline(fileStream, copyStream);

        // Move to real table with type casting and NULL handling
        await client.query(`
            INSERT INTO calendar (
                service_id,
                monday,
                tuesday,
                wednesday,
                thursday,
                friday,
                saturday,
                sunday,
                start_date,
                end_date,
                runname                    
            )
            SELECT
                service_id,
                monday,
                tuesday,
                wednesday,
                thursday,
                friday,
                saturday,
                sunday,
                start_date,
                end_date,
                $1
            FROM calendar_staging;
        `, [runName]);

        await client.query('COMMIT');
        console.log(`Imported Calendar for: ${runName}`);        
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }
}