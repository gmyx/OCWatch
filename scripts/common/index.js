function join (date, options, separator) {
    function format(option) {
        let formatter = new Intl.DateTimeFormat('en', option);
        return formatter.format(date);
    }
    return options.map(format).join(separator);    
};

module.exports = {
    static: {
        getRunname: function () {
            let options = [{year: 'numeric'}, {month: 'short'}, {day: 'numeric'}];
            let joined = join(new Date, options, '-');
            
            return joined;   
        },

        getDBName: function() {
   
            return this.getRunname() + '.db';
        },
        // URL to download the zip file from
        ocTranspoPath : 'https://oct-gtfs-emasagcnfmcgeham.z01.azurefd.net/public-access/GTFSExport.zip'
    },

    realtime: {
        getRunname: function () {
            let options = [{year: 'numeric'}, {month: 'short'}, {day: 'numeric'}, {hour: 'numeric', hour12: false}, {minute: 'numeric'}];
            let joined = join(new Date, options, '-');
            
            return joined;   
        },
        getDBName: function() {
   
            return 'feedmessage.db';
        },
        // URL to download the protobuf of realtime data
        ocTranspoPath: 'https://nextrip-public-api.azure-api.net/octranspo/gtfs-rt-vp/beta/v1/VehiclePositions'
    }
};