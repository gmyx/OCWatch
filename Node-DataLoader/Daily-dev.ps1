docker run --rm -v "D:\DockerLocalFiles\Node-DataLoader\RunDaily:/usr/src/app" -v "/usr/src/app/node_modules" -v "D:\DockerLocalFiles\DuckDB-Storage:/data" ocwatch-daily node app/RunDaily.js $args
