
//each table has it's own file with 2 function, create and importData
import * as calendar_dates from './dbFuncsTables/calendar_dates.js';
import * as calendar from './dbFuncsTables/calendar.js';
import * as routes from './dbFuncsTables/routes.js';
import * as shapes from './dbFuncsTables/shapes.js'; 
import * as stop_times from './dbFuncsTables/stop_times.js'; 
import * as stops from './dbFuncsTables/stops.js'; 
import * as trips from './dbFuncsTables/trips.js'; 

//internal DB functions
export async function createTables (sql, runName) {
    //create tables and import data
    await calendar_dates.create(sql);
    await calendar_dates.importData(sql, runName);

    await calendar.create(sql);
    await calendar.importData(sql, runName);

    await routes.create(sql);
    await routes.importData(sql, runName);

    await shapes.create(sql);
    await shapes.importData(sql, runName);

    await stop_times.create(sql);
    await stop_times.importData(sql, runName);

    await stops.create(sql);
    await stops.importData(sql, runName);

    await trips.create(sql);
    await trips.importData(sql, runName);
}
