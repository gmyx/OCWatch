# OCWatch
An evidence project to get better data on OCTranspo

#loading static
node scripts\getstatic.js

#pred data into evidence
node scripts\runDaily.js

#running evidence sources (must have run data prep)
npm run sources --prefix .\Evidence\