var runStatic = require('./runStatic');
const common = require('./common');
var runName = common.static.getRunname();

(async() => {
  console.log ('OCTranspo Static Data Converter');
  console.log (`Run for ${runName}`);

  console.log ('');
  console.log ('Creating Data Folder...');
  runStatic.setupEnvironment();

  //download file, if not excluded via --nd command line
  if (process.argv.includes("--nd") === true) {
      console.log('Skipping Download');
  } else {
      console.log (`Downloading GTFS Export from ${common.static.ocTranspoPath}`);
      await runStatic.downloadStatic(runName);    
  }

  //extract results, unless nx is speficied
  if (process.argv.includes("--nx") === true) {
      console.log('Skipping Extract');
  } else {
    console.log ('Unzipping data');
    await runStatic.extract(runName);
  }

  //connect to db
  await runStatic.setupDB();

  //create the DB
  if (process.argv.includes("--nc") === true) {
    console.log('Skipping Extract');
  } else {
    console.log ('Creating database and loading data into tables');  
    await runStatic.createDB(runName);
  }
  
  console.log ('Post processing of data');
  await runStatic.postProcess(runName);

  console.log ('');
  console.log ('Done.');
})();