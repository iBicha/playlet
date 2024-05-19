// Description: Publish, sign the package and retrieve it from the Roku device
// It expects release/playlet.zip to exist

const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');
const { ArgumentParser } = require('argparse');

const config = getEnvVars(['ROKU_DEV_TARGET', 'ROKU_DEVPASSWORD', 'ROKU_SIGN_PASSWORD']);

const parser = new ArgumentParser({
    description: 'Sign package'
});

parser.add_argument('--out-file', { help: 'A zip file to sign' });
parser.add_argument('--out-dir', { help: 'Folder of the zip file' });
parser.add_argument('--staging-dir', { help: 'Path to the staging directory' });

const args = parser.parse_args();

const outFile = args.out_file;
const outDir = args.out_dir;
const stagingDir = args.staging_dir;

const options = {
    host: config.ROKU_DEV_TARGET,
    packagePort: config.ROKU_DEV_TARGET_PORT || 80,
    password: config.ROKU_DEVPASSWORD,
    outDir: outDir,
    outFile: outFile,
    failOnCompileError: true,
    stagingDir: stagingDir,
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
