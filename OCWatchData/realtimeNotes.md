# Notes from reading the specs and OC's implemenation
Based on looking at the data on Dec 30, 2025

Always using FULL_DATASET. Differential is not yet supported by GTFS and OC doesn't use it.
OC provides only required data, unless found other wise.

feedMessage.entity is the list of updates. seems to include non-busses in there, possibly their other vehicles. routes / trips in updates may not show up in daily data, speculation: chartered routes?

## Header
Header only has one usefull value, timestamp - this is when OC generated the data, not when we ran it. 

entity values provided are only the required ones:
entity.id
entity.vehicle

## entity.vehicle data provided
* multiCarriageDetails: allways null? not sure why it's there. 
* position: [object Object] ()
* * latitude: 45.38591766357422
* * longitude: -75.68218994140625
* * bearing: 227
* * speed: 8.046719551086426 (how odly specific, note it's in m/s, not k/h)
* timestamp: a timestamp of when bus/train last reported location - is different from header.timestamp
* vehicle: [object Object]
* * id: 4715
* trip:  [object Object] - not always present, only when running a trip
* * tripId: 7474160 (is tripid in the trips.txt)
* * startTime: 08:15:00
* * startDate: 20251230
* * scheduleRelationship: 0
* * routeId: 785 (usually a valid route, but not always)

thats it, most of the spec is not implemented. notably, next stop information. note, this is based on reviwing a small sample size of data

# Processing

## Current method to place a bus near a stop
Note: this method was created with the aid of ChatGPT, but it's not a blind implemenations. Using the turf NodeJs module
1. Convert data to arrays (shape to a lineString, stops to a multiPoint)
2. Put gps point onto line (reduces error)
3. find the next point (stop) along the line


## issues/limitations
* Does not cover situation where a bus double backs itself (e.g. small loop deviation). Example: Route 19 on Porter Island (near Chinese embasy)
* May not handle situations like blair station correctly for pass-thought trips, espcialy with the 25 doing the north road twice
* Need to determine how to choose between which 2 stops a bus is, most GPS fixes will be between stops
* * initial implementation will at 2 closest stop and pick last in sequence, will cover 99% of situations