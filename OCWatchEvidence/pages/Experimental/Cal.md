```sql calendar_service_id
select service_id from GTFS.calendar where calc_start_date = '20250321'
```

```sql trips_monday
select trip_id from trips where (service_id in ${calendar_service_id}) and route_id='11'
```

```sql stop_times_for_trip
select * from stop_times where trip_id in ${trips_monday} and timepoint=true order by arrival_time, stop_sequence 
```

```sql timepoints
select distinct stop_sequence from stop_times where trip_id in ${trips_monday} and timepoint=true
```

<DataTable data={stop_times_for_trip} />

---

```sql stop_times_for_trip_first_stop
select trip_id, arrival_time, stop_sequence, stop_id from stop_times where trip_id in ${trips_monday} and timepoint=true order by arrival_time, trip_id
```





