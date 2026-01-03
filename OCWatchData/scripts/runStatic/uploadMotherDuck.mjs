import { DuckDBConnection } from '@duckdb/node-api';

async function connectToMD(localDBName) {
    const connection = await DuckDBConnection.create();
    connection.run(`
        ATTACH 'md:';
        ATTACH '${import.meta.dirname}\\..\\..\\${localDBName}' as local_db;        
        CREATE OR REPLACE TABLE OCWatch.routes AS FROM local_db.routes;
        CREATE OR REPLACE TABLE OCWatch.shapes AS FROM local_db.shapes;
        CREATE OR REPLACE TABLE OCWatch.calendar AS FROM local_db.calendar;
        CREATE OR REPLACE TABLE OCWatch.trips AS FROM local_db.trips;
        CREATE OR REPLACE TABLE OCWatch.stops AS FROM local_db.stops;
        CREATE OR REPLACE TABLE OCWatch.stop_times AS FROM local_db.stop_times;
    `);

    //await connection.closeSync()
}

export {connectToMD}