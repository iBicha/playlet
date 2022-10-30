const path = require('path');
const ProgramBuilder = require('brighterscript').ProgramBuilder;
const DiagnosticSeverity = require('brighterscript').DiagnosticSeverity;

let programBuilder = new ProgramBuilder();
programBuilder.run({
  project: path.join(__dirname, '../', 'bsconfig.json')
}).then(() => {
  //fail if there are diagnostics
  if (programBuilder.program.getDiagnostics().filter((x) => x.severity === DiagnosticSeverity.Error).length > 0) {
    throw new Error('Encountered error diagnostics');
  } else {
    console.log('\nBuild is finished');
  }
}).catch(e => {
  console.log('error', e.message);
  process.exit(1);
});
