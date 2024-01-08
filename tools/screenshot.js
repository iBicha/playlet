// Description: Take a screenshot of the Roku device.
// Note that it can only take a screenshot of the dev channel. Production channels are not supported.

const { ArgumentParser } = require('argparse')
const rokuDeploy = require('roku-deploy');
const getEnvVars = require('./get-env-vars');

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Take a screenshot of the Roku device'
    });

    parser.add_argument('filename', { help: 'Path where the screenshot will be saved (without extension)' });

    return parser;
}

const parser = getArgumentParser();
const args = parser.parse_args()
const filename = args.filename;

const config = getEnvVars(['ROKU_DEV_TARGET', 'ROKU_DEVPASSWORD']);

const options = {
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: '.',
    outFile: filename
};

(async () => {
    try {
        await rokuDeploy.takeScreenshot(options);
        console.log(`${filename} created`);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
})();
