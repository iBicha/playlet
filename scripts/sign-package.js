const dotenv = require('dotenv')
const fs = require('fs');
const rokuDeploy = require('roku-deploy');

const zip_name = 'playlet.zip';

const config = dotenv.parse(fs.readFileSync('.vscode/.env'))

const options = {
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: 'release',
    outFile: zip_name,
    failOnCompileError: true,
    stagingDir: 'dist/build',
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
    catch (e) {
        console.error(e);
    }
})();
