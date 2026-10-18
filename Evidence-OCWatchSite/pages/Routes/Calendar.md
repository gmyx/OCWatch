```sql cal
select calendar.* from calendar left join calendar_dates on calendar.service_id = calendar_dates.service_id
where (exeption_type != 2 or exeption_type is null)
order by calendar.service_id desc;
```
{% table
    data="cal"
%}
{% /table %}