var pbjs = require("protobufjs-cli/pbjs"); // or require("protobufjs-cli").pbjs / .pbts

pbjs.main([ "--target", "static-module", "scripts/staticData/gtfs-realtime.proto","-o", "scripts/staticData/gtfs-realtime.proto.js" ], function(err, output) {
    if (err)
        throw err;
    // do something with output
});