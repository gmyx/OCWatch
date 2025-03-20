---
queries:
   - routes: routes.sql
---

# {params.route_id} - <Value data={routes_filtered} column=route_long_name />

```sql routes_filtered
select * from ${routes}
where route_id = '${params.route_id}'
```

<!--this query need improvement for Oc's stange weekday, using 7 as test for now -->
```sql trips_for_route
select trip_id from GTFS.trips where route_id = '${params.route_id}' and service_id=7
```

```sql stop_times_for_trip_id
select * from GTFS.stop_times where trip_id in (${trips_for_route}) and timepoint = true
```

<Tabs id="DoW">
   <Tab label="Sunday">   
      a   
   </Tab>
   <Tab label="Weekday">
      b
   </Tab>
   <Tab label="Saturday">
      c
   </Tab>
</Tabs>
