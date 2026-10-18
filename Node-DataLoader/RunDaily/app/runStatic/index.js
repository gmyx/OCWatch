//import { DuckDBInstance } from '@duckdb/node-api';
//import postgres from 'postgres'

import fs from 'fs';
import Downloader from "nodejs-file-downloader";
import unzipper from 'unzipper';
import pkg from 'pg';
const { Pool } = pkg;


import common from '../common/index.js';
import { createTables } from './dbFuncs.js';
import * as alterCalendar from './alterCalendar.js';

export function setupEnvironment() {
    fs.existsSync('data') || fs.mkdirSync('data');
}

export async function downloadStatic(runName) {    
    const downloader = new Downloader({
        url: common.static.ocTranspoPath, 
        directory: "./localdata",  
        fileName: `GTFSExport_${runName}.zip`,
        cloneFiles: false
    });

    
    try {
        const {filePath,downloadStatus} = await downloader.download(); //Downloader.download() resolves with some useful properties.

        console.log("All done");
    } catch (error) {
        //IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
        //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
        console.log("Download failed", error);
    }     
}

export async function extract(runName) {       
    const directory = await unzipper.Open.file(`./localdata/GTFSExport_${runName}.zip`);
    await directory.extract({ path: `./localdata/GTFSExport_${runName}` })    
}

//var instance;
var sql;

export async function setupDB() {    
    // Create a pool r
    sql = new Pool({
        connectionString: 'postgres://ocwAdmin:testing42@192.168.1.143:5432/ocw'
    });
    /*sql = postgres({
        host: '192.168.1.143',
        port: 5432,
        database: 'ocw',
        username: 'ocwAdmin',
        password: 'testing42',
        max: 5,
        idle_timeout: 2,
        options: '-c client_min_messages=warning'
    })
    try {
        const result = await sql`SELECT version();`;
        console.log('Connected to ocw! Postgres version:', result[0].version);
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }*/
}

export async function closeDB() {
    await sql.end();
}

export async function createDB(runName) {    
    await createTables(sql, runName);                 
}

export async function postProcess(runName) {    
    await alterCalendar.alter(sql, runName);    
}
