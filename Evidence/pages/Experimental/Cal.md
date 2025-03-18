```sql calendar
select service_id from GTFS.calendar where monday=true
```

```sql trips_monday
select * from trips where service_id in (${calendar})
```

<DataTable data={trips_monday} />
