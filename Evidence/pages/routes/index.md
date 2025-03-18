---
title: Routes
queries:
   - routes: routes.sql
---

Click on an item to see more detail


```sql routes_with_link
select *, '/routes/' || route_id as link
from ${routes}
```

<DataTable data={routes_with_link} link=link/>
