// Description: Publish, sign the package and retrieve it from the Roku device
// It expects release/playlet.zip to exist

const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');

const config = getEnvVars(['ROKU_DEV_TARGET', 'ROKU_DEVPASSWORD', 'ROKU_SIGN_PASSWORD']);

const options = {
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: 'release',
    outFile: 'playlet.zip',
    failOnCompileError: true,
    stagingDir: 'build/playlet-app',
    retainStagingDir: true,
    signingPassword: config.ROKU_SIGN_PASSWORD,
};

(async () => {
    try {
        // Sideload playlet.zip
        await rokuDeploy.publish(options);
        // Sign the package
        const remotePkgPath = await rokuDeploy.signExistingPackage(options);
        // Retrieve the signed package
        const localPkgFilePath = await rokuDeploy.retrieveSignedPackage(remotePkgPath, options);
        console.log(`Created signed package: ${localPkgFilePath}`)
    }
    catch (error) {
        console.error(error);
        throw error;
    }
})();
