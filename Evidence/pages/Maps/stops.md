```sql stops
select stop_lat,stop_lon,stop_name,stop_id from GTFS.stops
```
<PointMap 
    data={stops} 
    lat=stop_lat
    long=stop_lon  
    pointName=stop_name
    height=800
    tooltip={[
        {id: 'stop_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'stop_id'}
    ]}
/>

