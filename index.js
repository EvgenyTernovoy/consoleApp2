const app = require('commander');
const collect = require('./logic');

app
  .version('0.0.1', '-v, --version')
  .description('Create orderly collection');

app
  .command('collect <baseDir> <targetDir> [neededRemove]')
  .alias('c')
  .description('collect collection')
  .action((baseDir, targetDir, neededRemove) => {
    collect(baseDir, targetDir, neededRemove);
  });

app.parse(process.argv);
