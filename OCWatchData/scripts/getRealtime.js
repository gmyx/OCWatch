var runStatic = require('./runRealtime');
const common = require('./common');
const fs = require('fs');
const rtConfig = require('./runRealtime/config.mjs')

var ocKey = process.env.OCKEY;

if (ocKey === undefined) {
    throw new Error('OCKEY envrioment variable is not definned. It must be a valid API key provided by OC\nExample: Set OCKEY=abcd1234');
}

console.log ('OCTranspo Realtime Data Converter');
const options = {    
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: 'numeric', hour12: false,
    minute: "numeric",
    second: "numeric"
  };
const runStart = new Date().toLocaleDateString('en-ca', options);

(async() => {
console.log(runStart);
console.log(common.realtime.getRunname());

    let response = await fetch(common.realtime.ocTranspoPath, {
            headers: {'Ocp-Apim-Subscription-Key': ocKey}
    });

    if (response.ok) {            
        //convert from the proto file
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
    
        //const feedMessage = gtfs.transit_realtime.FeedMessage.decode(buffer);
        fs.writeFile(`${rtConfig.realtimePath}/${common.realtime.getRunname()}.pb`, buffer, (err) => {
            if (err) throw err;
                console.log('Protobuf data successfully written to user.pb');
            });
    } else {
        console.log ('Bad resonse')
    }
})();