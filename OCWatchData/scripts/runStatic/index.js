import { DuckDBInstance } from '@duckdb/node-api';
import { copyFile, rm } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import Downloader from "nodejs-file-downloader";
import unzipper from 'unzipper';


import common from '../common/index.js';
import { createTables, pruneNullColumns } from './dbFuncs.mjs';
import { alterCalendar } from './alterCalendar.mjs';
import { connectToMD } from './uploadMotherDuck.mjs';
import { tempPath, dailyPath } from './config.mjs';

var duckDBInstance;

export function setupEnvironment(runName) {
    existsSync(tempPath) || mkdirSync(tempPath);
    existsSync(dailyPath) || mkdirSync(dailyPath);
    existsSync(`${dailyPath}/${runName}`) || mkdirSync(`${dailyPath}/${runName}`);
}

export async function downloadStatic(runName) {    
    const downloader = new Downloader({
        url: common.static.ocTranspoPath, 
        directory: tempPath,  
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

        return
    }     

    //now copy to a folder for today - there is no move, so copy then rm
    await copyFile(`${tempPath}/GTFSExport_${runName}.zip`, `${dailyPath}/${runName}/GTFSExport.zip`)
    await rm(`${tempPath}/GTFSExport_${runName}.zip`)
}

export async function extract(runName) {       
    const directory = await unzipper.Open.file(`${dailyPath}/${runName}/GTFSExport.zip`);
    await directory.extract({ path: `${tempPath}/GTFSExport_${runName}` })    
}

export async function setupDB(dbName) {
    console.log(`DB Name is ${tempPath}/${dbName}.db`) 
    duckDBInstance = await DuckDBInstance.create(`${tempPath}/${dbName}.db`);
}

export async function createDB(runName) {    
    const connection = await duckDBInstance.connect();
    
    await createTables(connection, runName);    
    await pruneNullColumns(connection);       
    await connection.closeSync();    
}

export async function postProcess(runName) {    
    const connection = await duckDBInstance.connect();
    
    await alterCalendar(connection, runName);
    await connection.closeSync(); 
}

export async function close() {
    await duckDBInstance.closeSync();
}

export async function uploadToMotherduck(localDBName) {
    await connectToMD(localDBName);
}
