```sql trips
select * from GTFS.trips where route_id='14' and trip_id =  30511160
```

```sql trips_shape
select shape_id from GTFS.trips where route_id='14' and trip_id =  30511160
```

```sql shapes
select * from GTFS.shapes where shape_id = ${trips_shape}
```

```sql stops
select stops.stop_id, stops.stop_name, stop_lat, stop_lon, stop_times.arrival_time from GTFS.stops JOIN GTFS.stop_times on stop_times.stop_id = stops.stop_id where trip_id = 30511160 order by stop_sequence
```

```sql testGPS
select * from testGPS.testGPS
```

<BaseMap>
    <Points
        data={shapes}
        lat=shape_pt_lat
        long=shape_pt_lon        
    />
    <Points
        data={stops}
        lat=stop_lat
        long=stop_lon
        color=red
        pointName=stop_id
        tooltip={[
            {id: 'stop_id', fmt: 'id'},
            {id: 'arrival_time', fmt: 'hms'}
        ]}
    />
    <Points
        data={testGPS}
        lat=lat
        long=lon
        pointName=vehicleid
        tooltip={[
            {id: 'vehicleid', fmt: 'id'},
            {id: 'reportTime', fmt: 'hms'}
        ]}
        color=green
    />    
</BaseMap>