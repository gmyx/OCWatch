
//create extra field in calendar table - since Oc shows data up to 3 weeks into future, real date has to be calculated here
//while most of the time, it's day dependent, they do have some with more than one day for the LRT lines.

const date_fns = require('date-fns');

module.exports = {        
    alter: async function (db, runName) {
        
        await db.run('ALTER TABLE calendar ADD COLUMN IF NOT EXISTS calc_start_date STRING');
        
        const calendar = await db.runAndReadAll('Select * from calendar');
        var DoWCount = [0, 0, 0, 0, 0, 0, 0];

        //iterate every row to calculate a new data, based on why I think is happeing with OC data
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

        console.log('   -> Calculated actual date for calendar table');      
    }
}