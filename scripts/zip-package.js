const rokuDeploy = require('roku-deploy');

const zip_name = 'playlet.zip'

rokuDeploy.zipPackage({
    outDir: 'release',
    outFile: zip_name,
    //BUG: rokuDeploy does not read stagingDir properly fron config
    stagingDir: 'dist/build',
    retainStagingDir: true
}).then(function(){
    console.log(`${zip_name} created`)
}, function(error) {
    console.error(error);
});