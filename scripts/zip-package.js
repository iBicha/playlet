var rokuDeploy = require('roku-deploy');

const zip_name = 'playlet.zip'

rokuDeploy.zipPackage({
    outDir: 'release',
    outFile: zip_name,
    //BUG: rokuDeploy does not read stagingFolderPath properly fron config
    stagingFolderPath: 'dist/build'
}).then(function(){
    console.log(`${zip_name} created`)
}, function(error) {
    console.error(error);
});