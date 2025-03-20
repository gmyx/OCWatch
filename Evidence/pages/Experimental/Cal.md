```sql calendar_monday
select service_id from GTFS.calendar where monday=true
```

```sql trips_monday
select * from trips where service_id in (${calendar_monday})
```

Today is {(new Date().getFullYear(), new Date().getMonth()) }

<DataTable data={trips_monday} />
