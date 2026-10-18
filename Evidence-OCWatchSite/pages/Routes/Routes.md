```sql routes
select concat(route_id, ' - ', route_long_name) as formatted_name, * from routes order by route_sort_order;
```
```sql cal
select distinct calendar.* from calendar left join calendar_dates on calendar.service_id = calendar_dates.service_id
where (exeption_type != 2 or exeption_type is null)
order by calendar.service_id desc;
```
```sql trips_for_route
    select * from trips
    where 
        route_id = {{route_picker}}    
        AND service_id = {{date_picker}}
```
```sql tripsID_for_route
    select trip_id from trips
    where 
        route_id = {{route_picker}}    
        AND service_id = {{date_picker}}
```
```sql stops_times_for_trips
select * from stop_times
where trip_id in ({{tripsID_for_route}})
order by trip_id, stop_sequence
```

{% filter_bar %}
    {% dropdown
        id="route_picker"
        data="routes"
        value_column="route_id"
        label_column="formatted_name"
        order="route_sort_order"
    /%}
    {% dropdown
        id="date_picker"
        data="cal"
        value_column="service_id"
        label_column="calc_start_date"
        order="calc_start_date"
    /%}
{% /filter_bar %}


{% table
    data="trips_for_route"
%}
{% /table %}
{% table
    data="stops_times_for_trips"
%}
{% /table %}
test4