
//create extra field in calendar table - since Oc shows data up to 3 weeks into future, real date has to be calculated here
//while most of the time, it's day dependent, they do have some with more than one day for the LRT lines.

//note, this is not documented anywhere by OC - and its not clear but I think OCTranspo does not follow the GTFS spec here
//calendar_dates.txt confuses things significantly - it removes ALOT of stuff, but adds others - but all are present in trips.txt
//if I follow the spec, I do get 7 days of service, Ignoreing the LRT stuff which is seperate
//to get there, take calendar and remove all the '2' from calendar_dates - this leaves 7 days
//so that is why I follow, but could be oh so wrong. but it's OCTranspo - so.....

import * as date_fns from 'date-fns'; //need to import only needed funcs, but just for testing

export async function alter (sql, runName) {
    //calculate the correct date
    const client = await sql.connect();
    try {
        // Begin transaction
        await client.query('BEGIN');

        await await client.query(`
            ALTER TABLE calendar ADD COLUMN IF NOT EXISTS calc_start_date DATE
        ;`);

        const { rows } = await client.query('SELECT * FROM calendar WHERE runname = $1', [runName])
        for (const row of rows) {
            //do some fun stuff with arrays to get the first Day of Week that is true
            const weekVal = [row.sunday, row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday];
            const firstDoW = weekVal.indexOf(true); //number is DoW
            
            //ensure we got atleast one - never know with OC and their complicance with standards
            if (firstDoW !== -1) {
                var trueStartDate = date_fns.nextDay(row.start_date, firstDoW)
                //update row
                const result = await client.query(`
                    UPDATE calendar 
                    SET calc_start_date = $1 
                    WHERE service_id = $2 and start_date = $3 AND runname = $4;
                `, [trueStartDate, row.service_id, row.start_date, row.runname]);            
                //console.log(`Service ${row.service_id}/${row.start_date}/${row.runname}: updated ${result.rowCount} row(s).`);
            }
        };

        await client.query('COMMIT');
        console.log(`Altered Calendar for: ${runName}`);  
    } catch (err) {
        console.error('Import failed:', err);
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err; 
    } finally {
        client.release();
    }

    /*

    await db.run('ALTER TABLE calendar ADD COLUMN IF NOT EXISTS calc_start_date VARCHAR(20)');
    
    const calendar = await db.runAndReadAll('Select * from calendar');
    var DoWCount = [0, 0, 0, 0, 0, 0, 0];

    //iterate every row to calculate a new data, based on what I think is happeing with OC data
    for (const row of calendar.getRowObjects()) {        
        const weekVal = [row.sunday, row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday]
        const firstDoW = weekVal.indexOf(true)            
        
        //convert string start date to actual date 
        var startDate = new Date(Date.UTC(row.start_date.substring(0,4), row.start_date.substring(4,6) - 1, row.start_date.substring(6,8)))                                                

        //if only one boolean, then add the DoWCount for that boolean
        var offset = 0;
        if (weekVal.filter(Boolean).length == 1 ) {
            DoWCount[firstDoW]++; //increase it's offset - yes, incrament before for math below
            offset = DoWCount[firstDoW];                                 
        }

        //get next Day of Week for the first found 'true' in calendar 
        var trueStartDate = date_fns.nextDay(startDate, firstDoW + (7 * offset))

        //now reconvert to format used by calendar
        //UTC is using since the date object is created without timexone
        const formatedTrueStartDate = `${trueStartDate.getUTCFullYear()}${("0" + (trueStartDate.getUTCMonth() + 1)).slice(-2)}${("0" + (trueStartDate.getUTCDate())).slice(-2)}`;
        //console.log(`${row.service_id} /w ${row.start_date} startDate: ${weekVal.filter(Boolean).length} <= ${firstDoW} is now ${trueStartDate} and becomes ${formatedTrueStartDate}`);               
        
        //update that row in the DB  
        const prepared = await db.prepare('UPDATE calendar set calc_start_date = $2 where service_id = $1');
        prepared.bindVarchar(2, formatedTrueStartDate);
        prepared.bindVarchar(1, row.service_id);
        await prepared.run();
        //console.log(`updated ${row.service_id}`)

    //});
    }

    console.log('   -> Calculated actual date for calendar table');      */
}
