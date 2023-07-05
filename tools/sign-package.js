const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');

const config = getEnvVars();

const options = {
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: 'release',
    outFile: 'playlet.zip',
    failOnCompileError: true,
    stagingDir: 'dist/build/playlet',
    retainStagingDir: true,
    signingPassword: config.ROKU_SIGN_PASSWORD,
};

(async () => {
    try {
        await rokuDeploy.publish(options);
        const remotePkgPath = await rokuDeploy.signExistingPackage(options);
        const localPkgFilePath = await rokuDeploy.retrieveSignedPackage(remotePkgPath, options);
        console.log(`Created signed package: ${localPkgFilePath}`)
    }
    catch (error) {
        console.error(error);
    }
})();
