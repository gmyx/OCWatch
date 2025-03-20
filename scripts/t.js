const date_fns = require('date-fns');

for (i=0; i<60; i++) {
  console.log("Next is: " + date_fns.nextDay(new Date("2025-03-07"), i));
}

