import { lineString, multiPoint, featureCollection, nearestPointOnLine, point, along, bearing } from '@turf/turf'
function getDistance(lat1,lat2,lon1,lon2){ //https://stackoverflow.com/a/8299508
    var R = 6371; // km
    var c = Math.PI / 180;
    var dLat = (lat2-lat1) * c;
    var dLon = (lon2-lon1) * c;
    var lat1 = lat1 * c;
    var lat2 = lat2 * c;

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

export function getClosestStop(stops, lat, lon) {  
                var closest = -1 , max = Number.MAX_VALUE;
    for (var row of stops) {        
        var dist= getDistance(row.stop_lat, lat, row.stop_lon, lon);
        if (dist < max) {
            //new closest
            closest = row.stop_id;
            max = dist;
        }                    
    }   
    
    return closest;
};

export function convertStopsToArray(stops) {    
    return featureCollection(stops.map( a => point([a.stop_lon, a.stop_lat], {stopId: a.stop_id})));
}

export function convertShapeToArray(shape) {
    //take the shape and convert it to a linestring
    return lineString(shape.map( a => [a.shape_pt_lon, a.shape_pt_lat]));
}

export function convertLocationToPoint(lon, lat) {
    return point([lon, lat]);
}

function bearingDiff(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function getNextStop(shapeLine, currentPos, stopPoints, vehicleBearing, bearingTolerance = 30) {
    //ensure our GPS point is one the line
    const fixedPos = nearestPointOnLine(shapeLine, currentPos, { units: 'meters' });  
    const currentDist = fixedPos.properties.location; //current distance along the route

    //fix distances to stops
    const stopDistances = stopPoints.features.map(feature => {
        const closetLine = nearestPointOnLine(shapeLine, feature, { units: 'meters' });
            const featurePos = nearestPointOnLine(shapeLine, feature, { units: 'meters' });
            return {
                feature: feature,
                dist: featurePos.properties.location
        };
    })

    const nextItem = stopDistances.find(p => p.dist > currentDist);
    return nextItem;
}