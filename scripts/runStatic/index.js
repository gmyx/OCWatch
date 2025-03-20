import duckdb from '@duckdb/node-api';
import { DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';
import Downloader from "nodejs-file-downloader";
import unzipper from 'unzipper';


import common from '../common/index.js';
import dbFuncs from './dbFuncs.js';
import alterCalendar from './alterCalendar.js';

export function setupEnvironment() {
    fs.existsSync('data') || fs.mkdirSync('data');
}

export async function downloadStatic(runName) {    
    const downloader = new Downloader({
        url: common.static.ocTranspoPath, 
        directory: "./data",  
        fileName: `GTFSExport_${runName}.zip`
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
    const directory = await unzipper.Open.file(`data\\GTFSExport_${runName}.zip`);
    await directory.extract({ path: `data\\GTFSExport_${runName}` })    
}

var instance;

export async function setupDB() {
    console.log(`DB Name is ${'data\\' + common.static.getDBName()}`) 
    instance = await DuckDBInstance.create('data\\' + common.static.getDBName());
}

export async function createDB(runName) {    
    const connection = await instance.connect();
    
    await dbFuncs.createTables(connection, runName);           
    await connection.close();    
}

export async function postProcess(runName) {    
    const connection = await instance.connect();
    
    await alterCalendar.alter(connection, runName);
    await connection.close(); 
}
