const rokuDeploy = require('roku-deploy');

const options = {
    outDir: 'release',
    outFile: 'playlet.zip',
    //BUG: rokuDeploy does not read stagingDir properly fron config
    stagingDir: 'dist/build',
    retainStagingDir: true
};

(async () => {
    try {
        await rokuDeploy.zipPackage(options);
        console.log(`${options.outFile} created`);
    }
    catch (error) {
        console.error(error);
    }
})();
